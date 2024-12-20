
type KikoOrder = {
    settlementData: {
      amount: number;
      status: string
    };
    kiranaProOrderId: string;
    buyerName: string;
    buyerPhoneNumber: string;
    orderAmount: number;
    orderExpiresTime: number;
    orderMode: string
    orderPaymentMode: string;
    orderDeliveryMode: string | null;
    totalWeight: number;
    vendorId: string;
    addressAddedBy: string;
    orderStatus: string;
    coinAmount: string;
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
      addressType: string;
      address_line1: string;
      landmark: string;
      address_line2: string;
    };
    createdFrom: string;
  };

export default KikoOrder;