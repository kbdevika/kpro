import prisma from "../config/prisma.config";
import { Catalogue, StoreAddress } from "../types/ondcStore.type";

export interface AIDataSchema {
  storeId: string;
  storeName: string;
  storeAddress: StoreAddress;
  items: Item[];
  completeness: number;
  processingTime: number;
  originalItems: OriginalItem[];
}

export interface Item {
  name: string;
  quantity: number;
  unit: string;
  metadata: Metadata | null;
}

export interface Metadata {
  matching: Matching | null;
  recommendations: Recommendations | null;
}

export interface Recommendations {
  productId: string;
  confidence: string;
  matchReason: string;
  product: _Product | null;
}

export interface Matching {
  productId: string;
  confidence: string;
  matchReason: string;
  product: Product | null;
}

export interface _Product {
  id: string;
  kikoId: string;
  metadata: Catalogue[] | null;
  lastUpdated: string;
  storeId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  kikoId: string;
  metadata: Catalogue | null;
  lastUpdated: string;
  storeId: string;
  createdAt: string;
}

export interface OriginalItem {
  name: string;
  quantity: number;
  unit: string;
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
} | null

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
  data: AIDataSchema
): Promise<CartResponse | -1> {

  if (
    !Array.isArray(data.items) ||
    data.items.length === 0 ||
    !data.items[0]?.metadata?.matching?.product?.metadata ||
    !data.items[0]?.metadata?.matching?.product?.metadata?.userId
  ) {
    // If any of the required properties or vendorId is missing, return -1
    return -1;
  }

  let subTotal = 0;
  let totalSavedAmount = 0;
  let shipping = 0;
  let total = 0;

  const newCart = await prisma.cart.create({
    data: {
      userId: userId,
      vendorId: data.items[0].metadata.matching.product.metadata.userId,
    },
  });

  let cartItems: CartReponseItem[] = data.items.map((item: Item) => {

      const productMetadata = item?.metadata?.matching?.product?.metadata;

      if (!productMetadata) {
        return null;
      }

      const quantity = parseInt(productMetadata.availableQuantity, 10) || 0;
      const requiredQuantity = 
      item.quantity && item.quantity <= 10 
        ? item.quantity 
        : 1; // Default to 1 if undefined or greater than 10

      const originalPrice = parseFloat(productMetadata.price) || 0;
      const discountedPrice = parseFloat(productMetadata.discountedPrice) || 0;
      const itemTotalPrice = requiredQuantity * discountedPrice;
    
      // Calculate the total saved amount for this item
      const itemSavedAmount = (originalPrice - discountedPrice) * requiredQuantity;
      totalSavedAmount += itemSavedAmount; // Increment total saved amount
    
      // Increment subTotal with the item's total price
      subTotal += itemTotalPrice;

      return {
        itemId: productMetadata.productId,
        itemName: productMetadata.productName,
        itemDescription: productMetadata.description,
        itemImageUrl: productMetadata.productImages,
        itemQuantity: requiredQuantity,
        itemOriginalPrice: parseFloat(productMetadata.price),
        itemDiscountedPrice: parseFloat(productMetadata.discountedPrice),
        itemStockStatus:
          quantity === 0
            ? "Out of Stock"
            : quantity < 30
            ? "Very Limited Stock"
            : "In Stock",
        itemWeight: productMetadata.weight,
        itemWeightUnit: productMetadata.weightUnit,
      }
  });

  await Promise.all(
    cartItems.map(async (item: CartReponseItem) => {
      if(item){
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
      }
    })
  );

  shipping = 35;
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
      storeName: data.storeName,
      storePhone: data.storeAddress.contactPersonMobile || '',
      storeContactPerson: data.storeAddress.contactPersonName || '',
      storeAddress: `${data.storeAddress.address1}, ${data.storeAddress.address2}, ${data.storeAddress.city}, ${data.storeAddress.state}, ${data.storeAddress.pincode}` || '',
    },
    additionalInfo: {
      savingsMessage: ``,
      cartNote: ``
    }
  };

  return cartResponse;
}
