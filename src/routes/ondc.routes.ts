import express from 'express';
import _sodium from 'libsodium-wrappers';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

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

export default ondcRouter