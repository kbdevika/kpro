import prisma from "../config/prisma.config";
import { Cart } from "../types/cart.type";
import { Order, OrderResponse } from "../types/order.type";

  type DBOrder = {
    id: string;
    cartId: string;
    status: string;
    deliveryStatus: string;
  }

  const shippingAmount = 35
  
function mapIncomingToOutgoing(order: DBOrder, cart: Cart, address: any, filteredProfile: any): Order {
  
  // Calculate the total amount and weight
  const totalAmount = cart.items.reduce((sum: number, item: any) => item.recommended === true ? sum : sum + (item.price * item.quantity), 0) + shippingAmount;
  const totalWeight = cart.items.reduce((sum: number, item: any) => {
    let weight = item.weight ?? 1;
    const unit = item.weightUnit?.toLowerCase();

    if (item.recommended === true) {
      weight = 0;
    } else if (unit === 'grams' || unit === 'gm' || unit === 'gms' || unit === 'gram') {
      weight /= 1000;
    } else if (unit !== 'kilo' && unit !== 'kilograms' || unit === 'kilogram' || unit === 'kg' || unit === 'kgs') {
      weight = 1;
    }
    return sum + (item.quantity * weight);
  }, 0);

  // Map the cart items to outgoing format
  const cartItems = cart.items.map((item: any) => ({
    id: item.externalProductId,
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
    buyerPhoneNumber: filteredProfile.phone || "",
    orderAmount: totalAmount,
    orderExpiresTime: 1440,
    orderMode: "Offline",
    orderPaymentMode: "KikoPayment",
    orderDeliveryMode: null,
    totalWeight: totalWeight,
    vendorId: cart.vendorId,
    addressAddedBy: "KiranaPro",
    orderStatus: "payment-completed",
    shippingAmount: 0,
    orderDescription: "",
    coinAmount: "0",
    freeDelivery: false,
    actualShippingAmount: shippingAmount,
    shippingAmountDiscount: 0,
    cartItem: cartItems,
    userAddress: userAddress,
    createdFrom: "KiranaPro",
    kiranaProOrderId: order.id,
  };
}


export default async function orderToKikoOrder(cartId: string, userId: string, addressId: number): Promise<{order: Order, _order: OrderResponse }> {

    const cart = await prisma.cart.findFirst({
      where: {
        id: cartId,
        userId: userId
      },
      include: {
        items: true
      }
    });

    const address = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId: userId
        },
      });

      const settings = await prisma.userSetting.findMany({
        where: { userId: userId }
      });

      if(!cart || typeof(cart) === 'undefined'){
        throw new Error('Cart not found')
      }

      if(!address || typeof(address) === 'undefined'){
        throw new Error('Address not found')
      }
  
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

      const _order = await prisma.order.create({
        data: {
          cartId: cartId,
          status: 'created',
          addressId: addressId,
          storeName: cart.storeName ? cart.storeName : '',
          vendorId: cart.vendorId
        },
        include: {
          address: true,
          cart: {
            include: {
              items: true
            }
          },
        }
      });
      
    const order = mapIncomingToOutgoing(_order, cart, address, filteredProfile)
    return { order, _order };
}