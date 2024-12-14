import prisma from "../config/prisma.config";
import TaskResult, { Items } from "../types/ai.type";
import { CartReponseItem, CartResponse } from "../types/cart.type";

export default async function convertToCart(
  userId: string,
  data: TaskResult
): Promise<CartResponse | -1> {

  if (
    !Array.isArray(data.result.items) ||
    data.result.items.length === 0 ||
    !data.result.items[0]?.metadata ||
    !data.result.items[0]?.metadata?.matching?.product?.metadata ||
    !data.result.items[0]?.metadata?.matching?.product?.metadata?.userId ||
    !data.result.items[0]?.metadata?.recommendations[0]?.product?.metadata ||
    !data.result.items[0]?.metadata?.recommendations[0]?.product?.metadata?.userId
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
      vendorId: data.result.storeData._id,
    },
  });


  let cartItems: CartReponseItem[] = data.result.items.map((item: Items) => {

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
        itemId: productMetadata._id,
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

  let recommendedCartItems: CartReponseItem[] = data.result.items.flatMap((item: Items) => {
    const recommendations = item?.metadata?.recommendations;
  
    if (!recommendations || !Array.isArray(recommendations)) {
      return []; // Return an empty array if recommendations are missing or not an array
    }
  
    return recommendations.flatMap((recommendation) => {
      const productMetadata = recommendation?.product?.metadata;
  
      if (!productMetadata) {
        return []; // Skip this recommendation if product metadata is missing
      }
  
      const quantity = parseInt(productMetadata.availableQuantity, 10) || 0;
      const requiredQuantity =
        item.quantity && item.quantity <= 10 ? item.quantity : 1; // Default to 1 if undefined or greater than 10
  
      return {
        itemId: productMetadata._id,
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
      };
    });
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

  await Promise.all(
    recommendedCartItems.map(async (item: CartReponseItem) => {
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
            recommended: true
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
      recommendedItems: recommendedCartItems
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
      storeName: data.result.storeData.storeName,
      storePhone: data.result.storeData.storeAddress.contactPersonMobile || '',
      storeContactPerson: data.result.storeData.storeAddress.contactPersonName || '',
      storeAddress: `${data.result.storeData.storeAddress.address1}, ${data.result.storeData.storeAddress.address2}, ${data.result.storeData.storeAddress.city}, ${data.result.storeData.storeAddress.state}, ${data.result.storeData.storeAddress.pincode}` || '',
    },
    additionalInfo: {
      savingsMessage: ``,
      cartNote: ``
    }
  };

  return cartResponse;
}
