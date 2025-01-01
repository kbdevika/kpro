import { createAuthorizationHeader } from "ondc-crypto-sdk-nodejs";
import { ONDC_BPP_ID } from "../constants";

export async function generateHeaders(payload: string): Promise<string> {
    // Generate the signed Authorization header
    return await createAuthorizationHeader({
        body: JSON.stringify(payload),
        privateKey: process.env.SIGNING_PRIVATE_KEY || 'signing_private_key',
        subscriberId: ONDC_BPP_ID, // Subscriber ID that you get after registering to ONDC Network
        subscriberUniqueKeyId: process.env.UNIQUE_KEY_ID || 'subscriber_ukid', // Unique Key Id or uKid that you get after registering to ONDC Network
    });
}

export async function validateHeaders(payload: string): Promise<string> {
    // Generate the signed Authorization header
    return await createAuthorizationHeader({
        body: JSON.stringify(payload),
        privateKey: process.env.SIGNING_PRIVATE_KEY || 'signing_private_key',
        subscriberId: ONDC_BPP_ID, // Subscriber ID that you get after registering to ONDC Network
        subscriberUniqueKeyId: process.env.UNIQUE_KEY_ID || 'subscriber_ukid', // Unique Key Id or uKid that you get after registering to ONDC Network
    });
}