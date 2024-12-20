import { Items, MorRItems } from "../types/ai.types";
import CartItemsModel, { CartItemsModelType } from "../types/database.types";
import { OndcCatalogue } from "../types/ondcStore.types";

/**
 * 
 * @param sourceItem 
 * @returns 
 * 
 * Helper to parse product metadata
 */
export function parseMatchingProductMetadata(sourceItem: MorRItems): OndcCatalogue | null {
  const productMetadata = sourceItem?.product?.metadata;
  if (!productMetadata) return null;
  return productMetadata;
}
  

/**
 * Calculates the total price and the amount saved for a given quantity of items.
 *
 * @param {number} originalPrice - The original price of a single item (must be positive).
 * @param {number} discountedPrice - The discounted price of a single item (must be positive).
 * @param {number} quantity - The number of items being purchased (must be positive).
 * @returns {{ itemTotalPrice: number; itemSavedAmount: number }} - An object containing:
 *   - `itemTotalPrice`: The total price after applying the discount, rounded to 2 decimal places.
 *   - `itemSavedAmount`: The total amount saved by purchasing at the discounted price, rounded to 2 decimal places.
 */
export function calculatePrices(
    originalPrice: number,
    discountedPrice: number,
    quantity: number
  ): { itemTotalPrice: number; itemSavedAmount: number } {

  if (originalPrice <= 0 || discountedPrice <= 0 || quantity <= 0 || isNaN(quantity) || isNaN(originalPrice) || isNaN(discountedPrice)) {
    return { itemTotalPrice: 0, itemSavedAmount: 0 };
  }

  // Calculate the total price and saved amount
  const itemTotalPrice = quantity * discountedPrice;
  const itemSavedAmount = (originalPrice - discountedPrice) * quantity;

  // Round both values to 2 decimal places
  return {
    itemTotalPrice: parseFloat(itemTotalPrice.toFixed(2)),
    itemSavedAmount: parseFloat(itemSavedAmount.toFixed(2))
  };
}
  
/**
 * Determines the stock status based on the quantity provided.
 *
 * @param {number} quantity - The quantity of items available in stock. Must be a non-negative number.
 * @returns {string} - The stock status as one of the following:
 *   - "Out of Stock" if quantity is 0 or invalid.
 *   - "Very Limited Stock" if quantity is between 1 and 30 (inclusive).
 *   - "In Stock" if quantity is greater than 30.
 */
export function getStockStatus(quantity: number): string {
  if(quantity <= 0 || isNaN(quantity)) return "Out of Stock";
  if (quantity <= 30) return "Very Limited Stock";
  return "In Stock";
}
  
/**
 * 
 * @param productMetadata 
 * @param recommended 
 * @param quantity 
 * @returns 
 * 
 * Helper to map a single source item
 */
export function mapSingleItem(
    productMetadata: OndcCatalogue,
    recommended: boolean,
    quantity: number
  ): CartItemsModelType {
    const originalPrice = parseFloat(productMetadata.price) || 0;
    const discountedPrice = parseFloat(productMetadata.discountedPrice) || 0;
  
    return {
      itemName: productMetadata.productName,
      itemDescription: productMetadata.description,
      itemImageUrl: productMetadata.productImages[0],
      itemQuantity: quantity,
      itemOriginalPrice: originalPrice,
      itemDiscountedPrice: discountedPrice,
      itemStockStatus: getStockStatus(parseInt(productMetadata.availableQuantity, 10) || 0),
      itemWeight: productMetadata.weight,
      itemWeightUnit: productMetadata.weightUnit,
      itemRecommended: recommended,
      itemExternalId: productMetadata._id,
    };
  }

  
/**
 * @param items
 * @param recommended 
 * @param getSource 
 * @returns 
 * 
 */
export default function mapCartItems(
    items: Items[],
    recommended: boolean,
    getSource: (item: Items) => MorRItems[]
  ): { cartItems: CartItemsModelType[]; subTotal: number; totalSavedAmount: number } {
    let localSubTotal = 0;
    let localSavedAmount = 0;
  
    const cartItems = items.flatMap((item: Items) => {
      const sourceData = getSource(item);
      const sourceArray = Array.isArray(sourceData) ? sourceData : [sourceData];
  
      if (!sourceArray || sourceArray.length === 0) {
        return [];
      }
  
      return sourceArray.flatMap((sourceItem: MorRItems) => {
        const productMetadata = parseMatchingProductMetadata(sourceItem);
        if (!productMetadata) return [];
  
        const quantity = item.quantity && item.quantity <= 10 ? item.quantity : 1;
        const { itemTotalPrice, itemSavedAmount } = calculatePrices(
          parseFloat(productMetadata.price) || 0,
          parseFloat(productMetadata.discountedPrice) || 0,
          quantity
        );
  
        if (!recommended) { 
          localSubTotal += itemTotalPrice;
          localSavedAmount += itemSavedAmount;
        }
  
        return mapSingleItem(productMetadata, recommended, quantity);
      });
    });
  
    return { cartItems, subTotal: localSubTotal, totalSavedAmount: localSavedAmount };
}
