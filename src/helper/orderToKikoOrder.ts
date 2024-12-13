import prisma from "../config/prisma.config";

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

  type DBOrder = {
    id: string;
    cartId: string;
    status: string;
    deliveryStatus: string;
  }

  type CartItems = {
      id: number;
      name: string;
      cartId: string;
      externalProductId: string;
      description: string;
      quantity: number;
      units: string;
      price: number;
      image: string;
  }

  type Cart = {
    id: string;
    userId: string;
    vendorId: string;
    items: CartItems[]; 
  };

  const shippingAmount = 35
  
function mapIncomingToOutgoing(order: DBOrder, cart: Cart, address: any, filteredProfile: any): Order {
  
  // Calculate the total amount and weight
  const totalAmount = cart.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) + shippingAmount;
  const totalWeight = cart.items.reduce((sum: number, item: any) => {
    let weight = item.weight ?? 1;
    const unit = item.weightUnit?.toLowerCase();

    if (unit === 'grams' || unit === 'g') {
      weight /= 1000;
    } else if (unit !== 'kg' && unit !== 'kilograms') {
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
    shippingAmount: shippingAmount,
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


export default async function orderToKikoOrder(cartId: string, userId: string, addressId: number): Promise<Order> {

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

      const order = await prisma.order.create({
        data: {
          cartId: cartId,
          status: 'created',
          addressId: addressId,
        }
      });
    const modifiedorder = mapIncomingToOutgoing(order, cart, address, filteredProfile)
    return modifiedorder;
}