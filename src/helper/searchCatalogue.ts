import Store from "../types/ondcStore.type";

  type Product = {
    productId: string;
    productName: string;
    productImage: string;
    productPrice: string;
    discountedPrice: string;
    storeId: string;
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
  
  // Simple fuzzy matching function to compare product names
  const fuzzyMatch = (str1: string, str2: string): boolean => {
    const threshold = 0.6; // The minimum similarity ratio to consider a match
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const similarity = (a: string, b: string) => {
      const commonLength = Math.min(a.length, b.length);
      let matches = 0;
  
      for (let i = 0; i < commonLength; i++) {
        if (a[i] === b[i]) matches++;
      }
  
      return matches / commonLength;
    };
  
    return similarity(normalize(str1), normalize(str2)) >= threshold;
  };
  
  // Get products within delivery radius and prioritize those within 3km
  function getProductsWithinRadius(
    latitude: number,
    longitude: number,
    catalogue: Store[]
  ): Product[] {
    const products: Product[] = [];
  
    if(!catalogue || catalogue.length === 0){
      return []
    }
    
    catalogue.forEach((store) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        store.storeAddress.latitude,
        store.storeAddress.longitude
      );
  
      const isWithin3Km = distance <= 3;
      const isWithinStoreRadius = distance <= store.deliveryRadius;
  
      // Only include products if within 3km or store delivery radius
      if (isWithinStoreRadius) {
        store.cataloguesArray.forEach((product) => {
          // Prioritize products within 3km
          products.push({
            productId: product.productId,
            productName: product.productName,
            productImage: product.productImages[0] || "",
            productPrice: product.price,
            discountedPrice: product.discountedPrice,
            storeId: store.id,
          });
        });
      }
  
      // Also include products from stores beyond 3km but within their delivery radius
      if (!isWithin3Km && isWithinStoreRadius) {
        store.cataloguesArray.forEach((product) => {
          products.push({
            productId: product.productId,
            productName: product.productName,
            productImage: product.productImages[0] || "",
            productPrice: product.price,
            discountedPrice: product.discountedPrice,
            storeId: store.id,
          });
        });
      }
    });
  
    return products;
  }
  
  // Function to search for the best product from the filtered list
  export default function searchCatalogue(
    itemName: string,
    latitude: number,
    longitude: number,
    catalogue: Store[]
  ): Product | null {
    // Get products within radius
    const products = getProductsWithinRadius(latitude, longitude, catalogue);
  
    // Find the best match for the given item name using fuzzy matching
    let bestProduct: Product | null = null;
  
    products.forEach((product) => {
      // Perform fuzzy matching on the product name
      if (fuzzyMatch(product.productName, itemName)) {
        // If no best product found or this one has a lower discounted price, update
        if (
          !bestProduct ||
          parseFloat(product.discountedPrice) < parseFloat(bestProduct.discountedPrice)
        ) {
          bestProduct = product;
        }
      }
    });
  
    return bestProduct;
  }
  