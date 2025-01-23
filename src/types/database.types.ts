/** 
 * Database Models of the current schema implementation
 */

/** Cart */
export type CartModelType = {
  id?: string;
  cartStoreId: string;
  cartaiStoreId: string;
  cartStoreName: string;
  cartStorePhone: string;
  cartStoreContact: string;
  cartStoreAddress: string;
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
  couponId: string | null;
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
  endOTP: string;
  trackingURL: string;
  riderName: string;
  riderPhone: string;
  addressId: string;
  cartId: string;
  userId: string;
  address: UserAddressModelType;
  cart?: CartModelType
};

export type OrderResponse = {
  id: string;
  cart: CartModelType;
  address: UserAddressModelType;
  endOTP: string;
  trackingURL: string;
  riderName: string;
  riderPhone: string;
  createdDate: Date;
  orderStatus: string;
  orderDeliveryStatus: string;
  userId: string;
}

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

export type CouponModelType = {
  id: string | null;
  couponCode: string;
  discountType: string;
  discountValue: string;
  startDate: Date;
  expiryDate: Date;
  minimumOrderValue: string;
  maximumOrderValue: string;
  usageLimit: number;
  usageCount: number;
  users: string[];
}

export type ExposedCouponModel = {
  message: string;
  applied: boolean;
  discountedAmount: number | null;
  values: CouponModelType | null
}

export default UserModelType;