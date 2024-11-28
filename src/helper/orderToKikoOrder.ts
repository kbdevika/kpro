import prisma from "../config/prisma.config";
import fetchCatalogue from "./fetchCatalogue";

type Order = {
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
    orderStatus: "created"
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
  
function mapIncomingToOutgoing(incomingOrder: any, address: any, filteredProfile: any): any {
  // Extract the order details from incoming data
  const order = incomingOrder.orders;
  const cart = order.cart;
  
  // Calculate the total amount and weight
  const totalAmount = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const totalWeight = cart.items.reduce((sum: number, item: any) => sum + (item.quantity * 0.5), 0);

  // Map the cart items to outgoing format
  const cartItems = cart.items.map((item: any) => ({
    id: item.id,
    quantity: {
      count: item.quantity
    },
    price: item.price
  }));

  // Map the address to the outgoing format
  const userAddress = {
    city: address.city,
    state: address.state,
    zipcode: address.postalCode,
    contactName: filteredProfile.name || "",
    latitude: address.latitude.toString(),
    longitude: address.longitude.toString(),
    contactPhone: filteredProfile.phone,
    addressType: address.addressType,
    address_line1: `${address.street}, ${address.address_line1}`,
    landmark: address.landmark,
    address_line2: address.address_line2 || "",
  };

  // Construct the outgoing order format
  return {
    settlementData: {
      amount: totalAmount,
      status: "pending",
    },
    buyerName: filteredProfile.name || "", 
    buyerPhoneNumber: filteredProfile.phone,
    orderAmount: totalAmount,
    orderExpiresTime: 1440,
    orderMode: "Offline",
    orderPaymentMode: "SelfPayment",
    orderDeliveryMode: null,
    totalWeight: totalWeight,
    vendorId: cart.vendorId,
    addressAddedBy: "KiranaPro",
    orderStatus: "payment-completed",
    shippingAmount: 0,
    orderDescription: "",
    coinAmount: "0",
    freeDelivery: false,
    actualShippingAmount: 0,
    shippingAmountDiscount: 0,
    cartItem: cartItems,
    userAddress: userAddress,
    createdFrom: "KiranaPro",
    kiranaProOrderId: order.id,
  };
}


export default async function orderToKikoOrder(orderId: string, userId: string, addressId: number): Promise<Order> {

    const address = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId: userId
        },
      });

    const order = await prisma.order.findFirst({
        where: {
          id: orderId
        },
      });

      const settings = await prisma.userSetting.findMany({
        where: { userId: userId }
      });
  
      // Transform settings array into a key-value object
      const userProfile = settings.reduce((profile: any, setting: any) => {
        profile[setting.key] = setting.value;
        return profile;
      }, {});
  
      const filteredProfile = {
        id: userId,
        name: userProfile['name'] || '',
        email: userProfile['email'] || '',
        phone: userProfile['phone'] || '',
      };

    const modifiedorder = mapIncomingToOutgoing(order, address, filteredProfile)
    return modifiedorder;
}