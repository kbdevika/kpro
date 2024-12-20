/** 
 * Database Models of the current schema implementation
 */

/** Cart */
export type CartModelType = {
  id?: string;
  cartStoreId: string;
  cartStoreName: string;
  cartStorePhone: string;
  cartStoreContact: string;
  cartItems?: CartItemsModelType[];
  cartSubTotal: number;
  cartTotal: number;
  cartDeliverytime: number;
  cartFreeDeliveryThreshold: number;
  cartDeliveryCharges: number;
  cartDiscount: number;
  cartSaved: number;
  cartSavingsMessage: string;
  cartNote: string;
  userId: string;
};

/** Cart Items */
export type CartItemsModelType = {
  id?: string;
  itemName: string;
  itemDescription: string;
  itemImageUrl: string;
  itemQuantity: number;
  itemOriginalPrice: number;
  itemDiscountedPrice: number;
  itemStockStatus: string;
  itemWeight: number;
  itemWeightUnit: string;
  itemRecommended: boolean;
  itemExternalId: string | null;
}

/** Order */
export type OrderModelType = {
  id?: string;
  orderStatus: string;
  orderDeliveryStatus: string;
  addressId: string;
  cartId: string;
  userId: string;
  address: UserAddressModelType;
};


/** User Address */
export type UserAddressModelType = {
  id?: string;
  addressLine1: string;
  addressLine2: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  addressPostalCode: number;
  addressLatitude: number;
  addressLongitude: number;
  addressAddressType: string;
  addressLandmark: string;
  addressContactName: string;
  addressContactPhone: string;
  userId: string;
};


/** User */
export type UserModelType = {
  id?: string;
  userArchived: boolean;
  settings: UserSettingsModelType[];  
  addresses: UserAddressModelType[]; 
  notifications: NotificationModelType[];
  order: OrderModelType[];
  task: TaskModelType[]; 
  cart: CartModelType[]; 
};


/** User Settings */
export type UserSettingsModelType = {
  id?: string;
  settingsKey: string;
  settingsValue: string;
  userId: string;
};


/** Task */
export type TaskModelType = {
  id?: string;
  taskStatus: string;
  taskExternalId: string;
  taskCreatedDate: Date;
  cartId: string;
  userId: string;
};


/** Notification */
export type NotificationModelType = {
  id?: string;
  notificationMessage: string;
  notificationMediaUrl?: string;  // Optional field
  notificationCreatedDate: Date;
  userId: string;
};

/** Home */

export type HomeModelType = {
  data: {
    id: string;
    imageUrl: string;
    deeplink?: string;
  }[],
  title: string;
}

export default UserModelType;