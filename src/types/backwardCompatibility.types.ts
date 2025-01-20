/**
 * For Backward compactability,
 * Outgoing response mapped from service is to be in specific Types,
 * which are specified here
 */

import { ExposedCouponModel } from "./database.types";

// CartReponse
export type _CartResponseType = {
  aiStoreId: string;
  cartId: string;
  items: _CartReponseItem[];
  recommendedItems: _CartReponseItem[];
  orderSummary: {
    subTotal: number;
    total: number;
    deliverytime: string;
    freeDeliveryThreshold: number;
    deliveryCharges: number;
    saved: string;
    discount: number;
  };
  storeInfo: {
    storeName: string;
    storePhone: string;
    storeContactPerson: string;
    storeAddress: string;
  };
  additionalInfo: {
    savingsMessage: string;
    cartNote: string;
  };
  coupon: ExposedCouponModel
};

export type _CartReponseItem = {
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemImageUrl: string[];
  itemQuantity: number;
  itemOriginalPrice: number;
  itemDiscountedPrice: number;
  itemStockStatus: string;
  itemWeight: number;
  itemWeightUnit: string;
}

export type _CartItemsModelType = {
  id?: string;
  itemName: string;
  itemDescription: string;
  itemImageUrl: string[];
  itemQuantity: number;
  itemOriginalPrice: number;
  itemDiscountedPrice: number;
  itemStockStatus: string;
  itemWeight: number;
  itemWeightUnit: string;
  itemRecommended: boolean;
  itemExternalId: string | null;
}

// add user profile
export type _OrderResponse = {
  id: string;
  cart: _CartResponseType;
  address: _AddressType;
  orderStatus: string;
  orderDeliveryStatus: string;
  endOTP: string;
  trackingURL: string;
  riderName: string;
  riderPhone: string;
  createdDate: string;
  phone: string;
  userId: string;
}

export type _AddressType = {
  id: string;
  address_line1: string;
  address_line2: string;
  street: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  addressType: string;
  landmark: string;
  postalCode: string;
}