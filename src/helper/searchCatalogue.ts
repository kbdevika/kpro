import { Store, Catalogue } from "../types/ondcStore.type";

type MatchedStore = {
  foundedStore: Store;
  products: Catalogue[];
} | 0 | -1;

type Items = {
  name: string;
  quantity: number;
  unit: string;
};

// Helper function to calculate distance using the Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRadians = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return 6371 * c; // Distance in kilometers
};

// Helper function for exact match on itemName
const exactMatch = (str1: string, str2: string): boolean => {
  if (str1 == null || str2 == null) {
    return false;
  }
  str1 = str1.toString().toLowerCase().trim();
  str2 = str2.toString().toLowerCase().trim();
  return str1 === str2;
};

// Main search function
export default function searchCatalogue(
  items: Items[],
  latitude: number,
  longitude: number,
  catalogue: Store[]
): MatchedStore {
  let bestStore: Store | null = null;
  let storePresent: boolean = false;
  let bestMatchedProducts: Catalogue[] = [];
  let matchedProducts: Catalogue[] = [];
  let maxMatches = 0;

  // Iterate through the stores
  for (const store of catalogue) {
    storePresent = true;
    const distance = calculateDistance(
      latitude,
      longitude,
      store.storeAddress.latitude,
      store.storeAddress.longitude
    );

    if (distance <= store.deliveryRadius) {
      // Reset matchedProducts for each store
      matchedProducts = [];

      // Iterate through the products of the store
      for (const product of store.cataloguesArray) {
        const fieldsToMatch = [
          product.productName,
          product.l3,
          product.l4,
          product.subCategoryId,
          product.categoryId,
          product.brand,
        ];

        // Check each item in the provided list
        for (const item of items) {
          if (
            fieldsToMatch.some((field) => exactMatch(field, item.name)) &&
            !matchedProducts.some((p) => p.productId === product.productId)
          ) {
            matchedProducts.push({...product, requiredQuantity: item.quantity});
          }
        }
      }

      // If this store has more matched products, update the bestStore and bestMatchedProducts
      if (matchedProducts.length > maxMatches) {
        bestStore = store;
        bestMatchedProducts = [...matchedProducts]; // Copy matched products
        maxMatches = matchedProducts.length;
      } else if (matchedProducts.length === maxMatches) {
        // If the match count is the same, merge products
        bestMatchedProducts.push(...matchedProducts);
      }
    }
  }

  // Return results
  if (!storePresent || bestStore == null) {
    return -1; // No store found within the delivery radius
  }

  if (bestMatchedProducts.length === 0) {
    return 0; // No matched products found
  }

  return {
    foundedStore: bestStore,
    products: bestMatchedProducts,
  };
}