type Product = {
    externalProductId: string; // Product Id (_id) from ONDC/Kiko/Bryt Bazar
    name: string; // Product name, usually a string
    description: string; // Product description, usually a string
    quantity: number; // Product quantity, usually a number
    units: string; // Units of measurement, e.g., "kg", "pcs", "grams"
    price: number; // Price of the product, typically a number
    image: string; // URL or path to the product image
  };

  type CartItems = {
      id?: number;
      name: string;
      cartId?: string;
      externalProductId?: string;
      description: string;
      quantity: number;
      units: string;
      price: number;
      image: string;
      recommended: boolean | null
  }

  type Cart = {
    id: string;
    userId: string;
    vendorId: string;
    storeName?: string | null;
    items: CartItems[]; 
  };

type AICartResponse = {
    items: CartItems[],
    id: string;
    vendorId: string;
    userId: string;
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
    cartObject: {
      cartId: string;
      items: CartReponseItem[];
      recommendedItems: CartReponseItem[];
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

export {
    Cart,
    CartItems,
    CartResponse,
    AICartResponse,
    CartReponseItem
}
export default Product;