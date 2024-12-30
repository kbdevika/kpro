import middleware from "../middleware";

export const selectedMiddleware = prod()
  ? middleware.decodeFirebaseToken 
  : middleware.authenticateJWTToken;

export const kikoUrl = prod()
  ? "https://ondc.kiko.live/ondc-seller"   
  : "https://ondc-api.kiko.live/ondc-seller-v2";

export const disabledActualOrder = false;

export function prod(): boolean{
    return process.env.NODE_ENV === 'production'
}

export const ONDC_BPP_ID= 'https://api.kpro42.com';
export const ONDC_BPP_URI = 'https://api.kpro42.com/';
export const ONDC_GATEWAY_URL = 'https://preprod.gateway.ondc.org';
export const ONDC_DOMAIN = 'ONDC:RET10';
export const ONDC_CORE_VERSION = '1.2.0';

export const deliveryCharges = 35;
export const deliveryTime = 30;
export const cartDiscount = 0;
export const cartFreeDeliveryThreshold = 0;
export default kikoUrl
