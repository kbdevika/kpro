/**
 * For Backward compactability,
 * Outgoing response mapped from service is to be in specific Types,
 * which are specified here
 */

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

type AICartResponse = {
    items: CartItems[],
    id: string;
    vendorId: string;
    userId: string;
}

type CartItems = {
    id?: number;
    name: string;
    cartId?: string;
    externalProductId?: string;
    description: string;
    quantity: number;
    units: string;
    price: number;
    image: string;
    recommended: boolean | null
}
  