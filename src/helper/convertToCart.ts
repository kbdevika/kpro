import Store, { Catalogue } from "../types/ondcStore.type";
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

type OrderItems = {
  id: string;
  name: string;
  price: number;
  amount: number;
  quantity: number;
  unit: string;
  image: string[];
};

type CartResponse = {
  message: string;
  deliverytime: string;
  saved: string;
  storeName: string;
  storePhone: string;
  storeContactPerson: string;
  cart: {
    id: string;
    items: Catalogue[];
    orderSummary: {
      items: OrderItems[];
      subTotal: number;
      shipping: number;
      discount: number;
      total: number;
    };
  };
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

  // Generate orderItems array using map
  const orderItems: OrderItems[] = bestProduct.products.map((item) => {
    const amount = parseFloat(item.price);
    const discountedAmount = parseFloat(
      bestProduct.products.find((p) => p.productId === item.productId)?.discountedPrice || '0'
    );

    subTotal += amount;
    totalSavedAmount += discountedAmount - amount;

    return {
      id: item.productId,
      name: item.productName,
      price: amount,
      amount,
      quantity: 1,
      unit: item.weightUnit,
      image: item.productImages,
    };
  });

  shipping = subTotal >= 199 ? 0 : 27;
  total = subTotal + shipping;

  // Construct the CartResponse
  const cartResponse: CartResponse = {
    message: "Cart successfully created",
    deliverytime: `25 minutes`,
    saved: `₹${totalSavedAmount.toFixed(2)}`,
    storeName: bestProduct.foundedStore.storeName,
    storePhone: bestProduct.foundedStore.mobile,
    storeContactPerson: bestProduct.foundedStore.name,
    cart: {
      id: `cart_${Date.now()}`,
      items: bestProduct.products,
      orderSummary: {
        items: orderItems,
        subTotal: subTotal,
        shipping,
        discount: totalSavedAmount,
        total,
      },
    },
  };

  return cartResponse;
}
