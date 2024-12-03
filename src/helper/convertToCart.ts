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

type CartReponseItem = {
  itemName: string;
  itemImageUrl: string[];
  itemQuantity: number;
  itemOriginalPrice: number;
  itemDiscountedPrice: number;
  itemStockStatus: string;
  itemRequiredUnit: string;
  itemWeightUnit: string;
}

type CartResponse = {
  cart: {
    items: CartReponseItem[];
  };
  orderSummary: {
    subTotal: number;
    total: number;
    deliverytime: string;
    freeDeliveryThreshold: number;
    deliveryCharges: number;
    saved: string;
    discount: number
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
  data: AICartData,
  latitude: number,
  longitude: number
): Promise<CartResponse | 0 | -1> {
  const pincode = await getPincodeFromCoordinates(latitude, longitude);
  const catalogue = await fetchCatalogue(pincode);
  const bestProduct = searchCatalogue(data.items, latitude, longitude, catalogue);

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
      itemName: item.productName,
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
      itemRequiredUnit: item.requiredUnit || '1',
      itemWeightUnit: item.weightUnit,
    }
  });

  shipping = subTotal >= 199 ? 0 : 27;
  total = subTotal + shipping;

  // Construct the CartResponse
  const cartResponse: CartResponse = {
    cart: {
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
