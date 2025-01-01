import { createAuthorizationHeader, isHeaderValid } from "ondc-crypto-sdk-nodejs";
import { ONDC_BPP_ID, ONDC_BPP_URI, ONDC_CORE_VERSION, ONDC_DOMAIN } from "../constants";
import { v4 as uuidv4 } from 'uuid';
import dotnev from 'dotenv';
dotnev.config()

export async function generateHeaders(payload: string): Promise<string> {
    // Generate the signed Authorization header
    return await createAuthorizationHeader({
        body: JSON.stringify(payload),
        privateKey: process.env.SIGNING_PRIVATE_KEY || 'signing_private_key',
        subscriberId: ONDC_BPP_ID, // Subscriber ID that you get after registering to ONDC Network
        subscriberUniqueKeyId: process.env.UNIQUE_KEY_ID || 'subscriber_ukid', // Unique Key Id or uKid that you get after registering to ONDC Network
    });
}

export async function validateHeaders(header: string, body: string): Promise<boolean> {
    // Generate the signed Authorization header
    return await isHeaderValid({
        header,
        body,
        publicKey: 'TCZanUT6FbbVK/pL5TSg4FzDPZOrPXtuaT+24OCEXS8='
    })
}

export const generateContext = (action: string, city: string) => {
    return {
        domain: ONDC_DOMAIN,
        action: action,
        city,
        country: 'IND',
        core_version: ONDC_CORE_VERSION,
        timestamp: new Date().toISOString(),
        ttl: 'PT30S', // Time-to-live: 30 seconds
        transaction_id: uuidv4(), // Unique transaction ID
        message_id: uuidv4(), // Unique message ID
        bap_id: ONDC_BPP_ID,
        bap_uri: ONDC_BPP_URI,
    }
}