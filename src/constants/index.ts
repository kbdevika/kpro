import middleware from "../middleware";

export const selectedMiddleware = prod()
  ? middleware.decodeFirebaseToken 
  : middleware.authenticateJWTToken;

export const kikoUrl = prod()
  ? "https://ondc.kiko.live/ondc-seller"   
  : "https://ondc-api.kiko.live/ondc-seller-v2";

export const activateActualOrder = false;

export function prod(): boolean{
    return process.env.NODE_ENV === 'production'
}

export const deliveryCharges = 35;
export const deliveryTime = 30;
export const cartDiscount = 0;
export const cartFreeDeliveryThreshold = 0;
export default kikoUrl
