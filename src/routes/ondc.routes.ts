import express from 'express';
import _sodium from 'libsodium-wrappers';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { createAuthorizationHeader } from "ondc-crypto-sdk-nodejs";
import { ONDC_BPP_ID, ONDC_BPP_URI, ONDC_CORE_VERSION, ONDC_DOMAIN, ONDC_GATEWAY_URL } from '../constants';
import { ConfirmRequest, OnConfirmRequest, OnInitRequest, OnSearchRequest, OnSelectRequest, Order, SearchRequest } from '../types/ondc.types';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/prisma.config';

dotenv.config()

const ondcRouter = express.Router();

// ONDC Configuration
const ONDC_ENCRYPTION_PRIVATE_KEY = process.env.ENCRYPTION_PRIVATE_KEY || 'encryption-pvt-key'
const ONDC_PUBLIC_KEY = process.env.ONDC_PUBLIC_KEY || 'ondc-public-key'
const REQUEST_ID = process.env.REQUEST_ID || 'ondc-request-id'
const ONDC_SIGNING_PRIVATE_KEY = process.env.SIGNING_PRIVATE_KEY || 'signing-pvt-key'

// ONDC Site Verification
const htmlFile = `
<!--Contents of ondc-site-verification.html. -->
<!--Please replace SIGNED_UNIQUE_REQ_ID with an actual value-->
<html>
  <head>
    <meta
      name="ondc-site-verification"
      content="SIGNED_UNIQUE_REQ_ID"
    />
  </head>
  <body>
    ONDC Site Verification Page
  </body>
</html>
`;

const privateKey = crypto.createPrivateKey({
  key: Buffer.from(ONDC_ENCRYPTION_PRIVATE_KEY, 'base64'), // Decode private key from base64
  format: 'der', // Specify the key format as DER
  type: 'pkcs8', // Specify the key type as PKCS#8
});

const publicKey = crypto.createPublicKey({
  key: Buffer.from(ONDC_PUBLIC_KEY, 'base64'), // Decode public key from base64
  format: 'der', // Specify the key format as DER
  type: 'spki', // Specify the key type as SubjectPublicKeyInfo (SPKI)
});

const sharedKey = crypto.diffieHellman({
  privateKey: privateKey,
  publicKey: publicKey,
});

// Decrypt using AES-256-ECB
function decryptAES256ECB(key: any, encrypted: any) {
  const iv = Buffer.alloc(0); // ECB doesn't use IV
  const decipher = crypto.createDecipheriv('aes-256-ecb', key, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function signMessage(signingString: any, privateKey: any) {
  await _sodium.ready;
  const sodium = _sodium;
  const signedMessage = sodium.crypto_sign_detached(
    signingString,
    sodium.from_base64(privateKey, _sodium.base64_variants.ORIGINAL)
  );
  const signature = sodium.to_base64(
    signedMessage,
    _sodium.base64_variants.ORIGINAL
  );
  return signature;
}

/**
 * @swagger
 * /on_subscribe:
 *   post:
 *     summary: ONDC Subscribe BACKEND API
 *     description: Decrypts the provided 'string' using AES-256-ECB and returns the answer.
 *     tags:
 *       - ONDC (Backend)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriber_id:
 *                 type: string
 *                 description: The encrypted string to decrypt.
 *                 example: 'dev-api.kpro42.com'
 *               challenge:
 *                 type: string
 *                 description: The encrypted string to decrypt.
 *                 example: 'challengeString'
 *     responses:
 *       200:
 *         description: Successful response with the decrypted answer.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: The decrypted answer to the given string.
 *                   example: 'decryptedAnswerHere'
 *       400:
 *         description: Bad request, typically when 'string' is missing or invalid.
 *       500:
 *         description: Internal server error if decryption fails or other server issues occur.
 */
ondcRouter.post('/on_subscribe', function (req: any, res: any) {
  try {
    const { challenge } = req.body; // Extract the 'challenge' property from the request body
    const answer = decryptAES256ECB(sharedKey, challenge); // Decrypt the challenge using AES-256-ECB
    const resp = { answer: answer };
    res.status(200).json(resp); // Send a JSON response with the answer
  } catch (error: any) {
    res.status(500).json({ error: error });
  }
});


/**
 * @swagger
 * /ondc-site-verification.html:
 *   get:
 *     summary: ONDC HTML verification file BACKEND API
 *     description: DO NOT TAMPER! Returns a verification HTML file with a signed unique request ID, using the specified signing key.
 *     tags:
 *       - ONDC (Backend)
 *     responses:
 *       200:
 *         description: HTML verification file with signed request ID.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error if signing or file processing fails.
 */
ondcRouter.get('/ondc-site-verification.html', async (req: any, res: any) => {
  try {
    const signedContent = await signMessage(REQUEST_ID, ONDC_SIGNING_PRIVATE_KEY);
    // Replace the placeholder with the actual value
    const modifiedHTML = htmlFile.replace(/SIGNED_UNIQUE_REQ_ID/g, signedContent);
    // Send the modified HTML as the response
    res.send(modifiedHTML);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

ondcRouter.post('/search', async (req: any, res: any) => {
  try {
    const { query, location }: { query?: string; location?: { city?: string } } = req.body;

    // Validate query
    if (!query || typeof query !== 'string') {
      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'DOMAIN-ERROR',
          code: 'INVALID_QUERY',
          message: 'Invalid or missing query parameter.',
        },
      });
    }

    // Build the payload
    const payload: SearchRequest = {
      context: {
        domain: ONDC_DOMAIN,
        action: 'search',
        city: location?.city || 'std:080', // Default city Bangalore
        country: 'IND',
        core_version: ONDC_CORE_VERSION,
        timestamp: new Date().toISOString(),
        ttl: 'PT30S', // Time-to-live: 30 seconds
        transaction_id: uuidv4(), // Unique transaction ID
        message_id: uuidv4(), // Unique message ID
        bap_id: ONDC_BPP_ID,
        bap_uri: ONDC_BPP_URI,
      },
      message: {
        intent: {
          item: {
            descriptor: {
              name: query, // Search query
            },
          },
        },
      },
    };

    // Generate the signed Authorization header
    const header = await createAuthorizationHeader({
      body: JSON.stringify(payload),
      privateKey: process.env.SIGNING_PRIVATE_KEY!,
      subscriberId: ONDC_BPP_ID, // Subscriber ID that you get after registering to ONDC Network
      subscriberUniqueKeyId: "ae7686be-f644-47fb-a20e-da180cb6ec62", // Unique Key Id or uKid that you get after registering to ONDC Network
    });

    // Send the request to ONDC Gateway
    const response = await fetch(`${ONDC_GATEWAY_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: header,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'CORE-ERROR',
          code: 'GATEWAY_ERROR',
          message: `Failed to send search request to ONDC Gateway. ${errorText}`,
        },
      });
    }

    // Parse and send back the response
    const data = await response.json();
    res.status(200).json({
      message: {
        ack: { status: 'ACK' },
      },
      response: data,
    });
  } catch (error: any) {
    res.status(200).json({
      message: {
        ack: { status: 'NACK' },
      },
      error: {
        type: 'CORE-ERROR',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred while performing search.',
      },
    });
  }
});

ondcRouter.post('/on_search', async (req: any, res: any) => {
  try {
    const { context, message }: OnSearchRequest = req.body;

    // Validate the context object
    if (!context) {
      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'CONTEXT-ERROR',
          code: 'INVALID_CONTEXT',
          message: 'Invalid or missing context in on_search callback.',
        },
      });
    }

    // Validate the catalog data in the message
    if (!message?.catalog) {
      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'DOMAIN-ERROR',
          code: 'INVALID_CATALOG',
          message: 'Missing or invalid catalog in on_search callback data.',
        },
      });
    }

    // Save catalog data to the database
    await prisma.catalogue.create({
      data: {
        jsonData: JSON.stringify(message.catalog), // Ensure data is serialized
        pincode: '0000001', // Example pincode, customize as needed
      },
    });

    // Acknowledge the callback
    res.status(200).json({
      message: {
        ack: { status: 'ACK' },
      },
    });
  } catch (error: any) {
    // Return an error response with the appropriate error details
    res.status(200).json({
      message: {
        ack: { status: 'NACK' },
      },
      error: {
        type: 'CORE-ERROR',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred while handling on_search callback.',
      },
    });
  }
});

ondcRouter.post('/select', async (req: any, res: any) => {
  try {
    const { order }: { order: Order } = req.body;

    // Validate order structure
    if (!order || !order.provider?.id || !order.items || order.items.length === 0) {
      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'DOMAIN-ERROR',
          code: 'INVALID_ORDER',
          message: 'Invalid order data. Ensure provider and items are specified.',
        },
      });
    }

    // Ensure all items have valid quantities
    const invalidItems = order.items.filter(item => item.quantity.count < 1);
    if (invalidItems.length > 0) {
      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'DOMAIN-ERROR',
          code: 'INVALID_ITEM_QUANTITY',
          message: 'Invalid item quantities in the order. All items must have a count >= 1.',
        },
      });
    }

    // Build the payload
    const payload = {
      context: {
        domain: ONDC_DOMAIN,
        action: 'select',
        transaction_id: order.id || uuidv4(),
        message_id: uuidv4(),
        timestamp: new Date().toISOString(),
        bap_id: ONDC_BPP_ID,
        bap_uri: ONDC_BPP_URI,
      },
      message: { order },
    };

    const payloadString = JSON.stringify(payload);

    // Generate the signed Authorization header
    const authHeader = await createAuthorizationHeader({
      body: payloadString,
      privateKey: process.env.SIGNING_PRIVATE_KEY!,
      subscriberId: ONDC_BPP_ID,
      subscriberUniqueKeyId: process.env.SUBSCRIBER_UNIQUE_KEY_ID!,
    });

    // Send the request to ONDC Gateway
    const response = await fetch(`${process.env.ONDC_GATEWAY_URL}/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: payloadString,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'CORE-ERROR',
          code: 'GATEWAY_ERROR',
          message: `Failed to send select request to ONDC Gateway. ${errorText}`,
        },
      });
    }

    // Parse and send back the response
    const data = await response.json();
    res.status(200).json({
      message: {
        ack: { status: 'ACK' },
      },
      response: data,
    });
  } catch (error: any) {
    res.status(200).json({
      message: {
        ack: { status: 'NACK' },
      },
      error: {
        type: 'CORE-ERROR',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred while performing select.',
      },
    });
  }
});

ondcRouter.post('/on_select', async (req: any, res: any) => {
  try {
    const { context, message }: OnSelectRequest = req.body;

    // Validate message and order
    if (!context || !message?.order) {
      return res.status(200).json({
        message: {
          ack: { status: 'NACK' },
        },
        error: {
          type: 'DOMAIN-ERROR',
          code: 'INVALID_CALLBACK',
          message: 'Invalid on_select callback data. Ensure context and order are specified.',
        },
      });
    }

    // Process the received order
    console.log('Received on_select callback:', JSON.stringify(message.order, null, 2));

    // Send ACK response
    res.status(200).json({
      message: {
        ack: { status: 'ACK' },
      },
    });
  } catch (error: any) {
    console.error('Error in /on_select:', error.message);
    res.status(200).json({
      message: {
        ack: { status: 'NACK' },
      },
      error: {
        type: 'CORE-ERROR',
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred while handling on_select callback.',
      },
    });
  }
});

// ondcRouter.post('/init', async (req: any, res: any) => {
//   try {
//     const { order }: { order: Order} = req.body;

//     const payload = {
//       context: {
//         domain: ONDC_DOMAIN,
//         action: 'init',
//         transaction_id: order.transaction_id,
//         message_id: uuidv4(),
//         timestamp: new Date().toISOString(),
//         bap_id: ONDC_BPP_ID,
//         bap_uri: ONDC_BPP_URI,
//       },
//       message: { order },
//     };

//     const response = await fetch(`${process.env.ONDC_GATEWAY_URL}/init`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
//       },
//       body: JSON.stringify(payload),
//     });

//     const data = await response.json();
//     res.status(200).json(data);
//   } catch (error: any) {
//     res.status(500).json({ error: 'Failed to perform init' });
//   }
// });

// ondcRouter.post('/on_init', async (req: any, res: any) => {
//   try {
//     const { context, message }: OnInitRequest = req.body;

//     // Validate message and order
//     if (!message || (!message.order && !message.error)) {
//       return res.status(400).json({ error: 'Invalid on_init callback data' });
//     }

//     if (message.error) {
//       console.error('Error in on_init callback:', message.error);
//       return res.status(400).json({ error: message.error });
//     }

//     // Process the received order
//     console.log('Received on_init callback:', JSON.stringify(message.order, null, 2));

//     // Respond with ACK
//     res.status(200).json({
//       message: {
//         ack: { status: 'ACK' },
//       },
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: 'Failed to handle on_init callback' });
//   }
// });

// ondcRouter.post('/confirm', async (req: any, res: any) => {
//   try {
//     const { order }: ConfirmRequest = req.body;

//     // Validate the order object
//     if (!order || !order.transaction_id || !order.billing || !order.fulfillment || !order.payment) {
//       return res.status(400).json({ error: 'Invalid order data for confirm' });
//     }

//     // Build the payload
//     const payload = {
//       context: {
//         domain: ONDC_DOMAIN,
//         action: 'confirm',
//         transaction_id: order.transaction_id,
//         message_id: uuidv4(),
//         timestamp: new Date().toISOString(),
//         bap_id: ONDC_BPP_ID,
//         bap_uri: ONDC_BPP_URI,
//       },
//       message: { order },
//     };

//     // Send the request to the ONDC Gateway
//     const response = await fetch(`${process.env.ONDC_GATEWAY_URL}/confirm`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
//       },
//       body: JSON.stringify(payload),
//     });

//     // Parse and return the response
//     const data = await response.json();
//     res.status(200).json(data);
//   } catch (error: any) {
//     res.status(500).json({ error: 'Failed to confirm order' });
//   }
// });

// ondcRouter.post('/on_confirm', async (req: any, res: any) => {
//   try {
//     const { context, message }: OnConfirmRequest = req.body;

//     // Validate the incoming message
//     if (!message || (!message.order && !message.error)) {
//       return res.status(400).json({ error: 'Invalid on_confirm callback data' });
//     }

//     // Handle the error scenario
//     if (message.error) {
//       console.error('Error in on_confirm callback:', message.error);
//       return res.status(400).json({
//         error: {
//           type: message.error.type,
//           code: message.error.code,
//           message: message.error.message,
//         },
//       });
//     }

//     // Process the confirmed order
//     console.log('Received on_confirm callback:', JSON.stringify(message.order, null, 2));

//     // Respond with ACK
//     res.status(200).json({
//       message: {
//         ack: { status: 'ACK' },
//       },
//     });
//   } catch (error: any) {
//     res.status(500).json({ error: 'Failed to handle on_confirm callback' });
//   }
// });

export default ondcRouter;