import prisma from "../config/prisma.config";
import { Catalogue } from "../types/ondcStore.type";
import getPincodeFromCoordinates from "./convertLatLongToPincode";
import fetchCatalogue from "./fetchCatalogue";
import searchCatalogue from "./searchCatalogue";

type AICartData = {
  items: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  processingTime: number;
};

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

type CartReponseItem = {
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

type CartResponse = {
  cart: {
    cartId: string;
    items: CartReponseItem[];
  };
  orderSummary: {
    subTotal: number;
    total: number;
    deliverytime: string;
    freeDeliveryThreshold: number;
    deliveryCharges: number;
    discount: number
    saved: string;
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
  }
};

export default async function convertToCart(
  userId: string,
  data: AICartData,
  latitude: number,
  longitude: number
): Promise<CartResponse | 1 | 0 | -1> {
  const pincode = await getPincodeFromCoordinates(latitude, longitude);
  const catalogue = await fetchCatalogue(pincode);
  const bestProduct = searchCatalogue(data.items, latitude, longitude, catalogue);

  if(!userId || userId == null || userId == 'undefined'){
    // UserId not available
    return 1
  }

  if (bestProduct === -1) {
    // Pincode unserviceable
    return -1
  }

  if (bestProduct === 0) {
    // Store available but no products matched query
    return 0
  }

  let subTotal = 0;
  let totalSavedAmount = 0;
  let shipping = 0;
  let total = 0;

  const newCart = await prisma.cart.create({
    data: {
      userId: userId,
      vendorId: bestProduct.foundedStore.id,
    },
  });

  let cartItems: CartReponseItem[] = bestProduct.products.map((item: Catalogue) => {
    const quantity = parseInt(item.availableQuantity, 10) || 0;
    const requiredQuantity = 
    item.requiredQuantity && item.requiredQuantity <= 10 
      ? item.requiredQuantity 
      : 1; // Default to 1 if undefined or greater than 10

    const originalPrice = parseFloat(item.price) || 0;
    const discountedPrice = parseFloat(item.discountedPrice) || 0;
    const itemTotalPrice = requiredQuantity * discountedPrice;
  
    // Calculate the total saved amount for this item
    const itemSavedAmount = (originalPrice - discountedPrice) * requiredQuantity;
    totalSavedAmount += itemSavedAmount; // Increment total saved amount
  
    // Increment subTotal with the item's total price
    subTotal += itemTotalPrice;

    return {
      itemId: item.productId,
      itemName: item.productName,
      itemDescription: item.description,
      itemImageUrl: item.productImages,
      itemQuantity: requiredQuantity,
      itemOriginalPrice: parseFloat(item.price),
      itemDiscountedPrice: parseFloat(item.discountedPrice),
      itemStockStatus:
        quantity === 0
          ? "Out of Stock"
          : quantity < 30
          ? "Very Limited Stock"
          : "In Stock",
      itemWeight: item.weight,
      itemWeightUnit: item.weightUnit,
    }
  });

  await Promise.all(
    cartItems.map(async (item: CartReponseItem) => {
      return await prisma.cartItem.create({
        data: {
          cartId: newCart.id,
          externalProductId: item.itemId,
          name: item.itemName,
          description: item.itemDescription,
          quantity: item.itemQuantity,
          units: `${item.itemWeight} ${item.itemWeightUnit}`,
          price: item.itemDiscountedPrice,
          image: item.itemImageUrl[0],
        },
      });
    })
  );

  shipping = subTotal >= 199 ? 0 : 27;
  total = subTotal + shipping;

  // Construct the CartResponse
  const cartResponse: CartResponse = {
    cart: {
      cartId: newCart.id,
      items: cartItems,
    },
    orderSummary: {
      subTotal: subTotal,
      total: total,
      deliverytime: `25 minutes`,
      freeDeliveryThreshold: 199,
      deliveryCharges: shipping,
      saved: totalSavedAmount == 0 ? '' : `You saved ₹${totalSavedAmount.toFixed(2)}!`,
      discount: totalSavedAmount,
    },
    storeInfo: {
      storeName: bestProduct.foundedStore.storeName,
      storePhone: bestProduct.foundedStore.phone,
      storeContactPerson: bestProduct.foundedStore.name,
      storeAddress: `${bestProduct.foundedStore.storeAddress.address1}, ${bestProduct.foundedStore.storeAddress.address2}, ${bestProduct.foundedStore.storeAddress.city}, ${bestProduct.foundedStore.storeAddress.state}, ${bestProduct.foundedStore.storeAddress.pincode}`,
    },
    additionalInfo: {
      savingsMessage: ``,
      cartNote: ``
    }
  };

  return cartResponse;
}
