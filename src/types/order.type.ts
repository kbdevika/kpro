import { UserAddress } from "./address.type";
import { Cart, CartItems, CartReponseItem } from "./cart.type";

export type Order = {
    settlementData: {
      amount: number;
      status: "pending"
    };
    kiranaProOrderId: string;
    buyerName: string;
    buyerPhoneNumber: string;
    orderAmount: number;
    orderExpiresTime: number;
    orderMode: "Offline"
    orderPaymentMode: string;
    orderDeliveryMode: string | null;
    totalWeight: number;
    vendorId: string;
    addressAddedBy: string;
    orderStatus: "payment-completed";
    coinAmount: "0";
    shippingAmount: number;
    orderDescription: string;
    freeDelivery: boolean;
    actualShippingAmount: number;
    shippingAmountDiscount: number;
    cartItem: {
      id: string;
      quantity: {
        count: number;
      };
      price: number;
    }[];
    userAddress: {
      city: string;
      state: string;
      zipcode: string;
      contactName: string;
      latitude: string;
      longitude: string;
      contactPhone: string;
      addressType: "HOME" | "WORK" | "OTHER";
      address_line1: string;
      landmark: string;
      address_line2: string;
    };
    createdFrom: string;
  };

export type OrderSummaryResponse = {
    orderId:string,
    cart: {
      cartId: string;
      items: CartItems[];
    };
    orderSummary: {
      subTotal: number;
      total: number;
      payment: string;
    };
    storeInfo: {
      storeName: string;
    };
    additionalInfo: {
      savingsMessage: string;
      cartNote: string;
    }
  };

export type OrderResponse = {
    id: string;
    cart: Cart;
    cartId: string;
    status: string;
    addressId: number | null;
    storeName: string;
    vendorId: string;
    address: UserAddress | null;
}