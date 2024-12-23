import { CartItemsModel, CartModel, OrderModel, UserAddressModel } from "@prisma/client";
import prisma from "../config/prisma.config";
import KikoOrder from "../types/kikoOrder.types";
import { deliveryCharges } from "../constants";

export function mapIncomingToOutgoing(orderId: string, cart: CartModel, cartItems: CartItemsModel[], address: UserAddressModel): KikoOrder {
  
  // Calculate the total amount and weight
  const totalWeight = cartItems.reduce((sum: number, item: CartItemsModel) => {
    let weight = item.itemWeight ?? 1;
    const unit = item.itemWeightUnit.toLowerCase();

    if (item.itemRecommended === true) {
      weight = 0;
    } else if (unit === 'grams' || unit === 'gm' || unit === 'gms' || unit === 'gram') {
      weight /= 1000;
    } else if (unit === 'kilo' || unit === 'kilograms' || unit === 'kilogram' || unit === 'kg' || unit === 'kgs') {
      weight = 1;
    }
    return sum + (item.itemQuantity * weight);
  }, 0);

  // Map the cart items to outgoing format
  const _cartItems = cartItems
    .filter((item: CartItemsModel) => item.itemExternalId !== null)
    .map((item: CartItemsModel) => ({
      id: item.itemExternalId as string,
      quantity: {
        count: item.itemQuantity
      },
      price: item.itemDiscountedPrice
    }));

  // Map the address to the outgoing format
  const userAddress = {
    city: address.addressCity,
    state: address.addressState,
    zipcode: address.addressPostalCode.toString(),
    contactName: address.addressContactName,
    latitude: address.addressLatitude.toString(),
    longitude: address.addressLongitude.toString(),
    contactPhone: address.addressContactPhone,
    addressType: address.addressAddressType,
    address_line1: `${address.addressStreet}, ${address.addressLine1}`,
    landmark: address.addressLandmark,
    address_line2: address.addressLine2,
  };

  // Construct the outgoing order format
  return {
    settlementData: {
      amount: cart.cartTotal,
      status: "pending",
    },
    buyerName: address.addressContactName, 
    buyerPhoneNumber: address.addressContactPhone,
    orderAmount: cart.cartTotal,
    orderExpiresTime: 1440,
    orderMode: "Offline",
    orderPaymentMode: "KikoPayment",
    orderDeliveryMode: null,
    totalWeight: totalWeight,
    vendorId: cart.cartStoreId,
    addressAddedBy: "KiranaPro",
    orderStatus: "payment-completed",
    shippingAmount: 0,
    orderDescription: "",
    coinAmount: "0",
    freeDelivery: false,
    actualShippingAmount: deliveryCharges,
    shippingAmountDiscount: 0,
    cartItem: _cartItems,
    userAddress: userAddress,
    createdFrom: "KiranaPro",
    kiranaProOrderId: orderId,
  };
}


export default async function orderToKikoOrder(cartId: string, userId: string, addressId: string): 
  Promise<{kikoOrder: KikoOrder, order: OrderModel}> {
    try {
      if(!cartId || !userId || !addressId){
        throw new Error(`Missing or invalid inputs!`)
      }

      const order = await prisma.orderModel.create({
          data: {
            cartId: cartId,
            orderStatus: 'created',
            orderDeliveryStatus: 'not-initiated',
            userId: userId,
            addressId: addressId
          },
          include: {
            user: {
              include: {
                addresses: {
                  where: {
                    id: addressId
                  }
                }
              }
            },
            cart: {
              include: {
                cartItems: true
              }
            }
          }
      });

    const address = order.user.addresses.find(address => address.id === order.addressId);
    const cartItems = order.cart.cartItems
    
    if(!address){
      throw new Error(`Address not found while creating order!`)
    }

    if(cartItems.length === 0 || !order.cart){
      throw new Error(`Cart not found while creating order!`)
    }

    const kikoOrder = mapIncomingToOutgoing(order.id, order.cart, cartItems, address)
    return { kikoOrder, order};
  } catch(error: any){
    throw new Error(`Order creation failed: ${error.message}`)
  }
}