import { calculatePrices, getStockStatus } from '../../../src/helper/aiToCartMapper';

describe('calculatePrices', () => {
    it('should calculate total price and saved amount correctly for valid inputs', () => {
      const result = calculatePrices(100, 80, 2);
      expect(result).toEqual({
        itemTotalPrice: 160, // 2 * 80
        itemSavedAmount: 40, // (100 - 80) * 2
      });
    });
  
    it('should return zero for total price and savings when quantity is zero', () => {
      const result = calculatePrices(100, 80, 0);
      expect(result).toEqual({
        itemTotalPrice: 0,
        itemSavedAmount: 0,
      });
    });
  
    it('should handle edge case where original and discounted prices are equal', () => {
      const result = calculatePrices(50, 50, 3);
      expect(result).toEqual({
        itemTotalPrice: 150, // 3 * 50
        itemSavedAmount: 0,  // (50 - 50) * 3
      });
    });
  
    it('should handle negative prices gracefully', () => {
      const result = calculatePrices(-100, -80, 2);
      expect(result).toEqual({
        itemTotalPrice: 0, // -80 price -> invalid price
        itemSavedAmount: 0,
      });
    });

    it('should round to 2 decimal places for itemTotalPrice and itemSavedAmount', () => {
        const originalPrice = 10.505;
        const discountedPrice = 5.555;
        const quantity = 2.5;
    
        const result = calculatePrices(originalPrice, discountedPrice, quantity);
    
        expect(result.itemTotalPrice).toBeCloseTo(13.89, 2);  // Expected to be 2.5 * 5.555 = 13.8875, rounded to 13.89
        expect(result.itemSavedAmount).toBeCloseTo(12.38, 2);  // Expected to be (10.505 - 5.555) * 2.5 = 12.375, rounded to 12.38
      });

    it('should return 0 for invalid inputs', () => {
        expect(calculatePrices(0, 5.555, 2)).toEqual({ itemTotalPrice: 0, itemSavedAmount: 0 });
        expect(calculatePrices(10.505, -1, 2)).toEqual({ itemTotalPrice: 0, itemSavedAmount: 0 });
        expect(calculatePrices(10.505, 5.555, -2)).toEqual({ itemTotalPrice: 0, itemSavedAmount: 0 });
      });
  
    it('should handle large numbers without precision errors', () => {
      const result = calculatePrices(1e6, 9e5, 1e3);
      expect(result).toEqual({
        itemTotalPrice: 9e8, // 1000 * 900000
        itemSavedAmount: 1e8, // (1000000 - 900000) * 1000
      });
    });
  });

describe('getStockStatus', () => {
    it('should return "Out of Stock" when quantity is 0', () => {
      const result = getStockStatus(0);
      expect(result).toBe("Out of Stock");
    });
  
    it('should return "Very Limited Stock" when quantity is less than 30', () => {
      expect(getStockStatus(1)).toBe("Very Limited Stock");
      expect(getStockStatus(30)).toBe("Very Limited Stock");
    });
  
    it('should return "In Stock" when quantity is 31 or more', () => {
      expect(getStockStatus(31)).toBe("In Stock");
      expect(getStockStatus(100)).toBe("In Stock");
    });
  
    it('should return "Out of Stock" for negative quantities', () => {
      const result = getStockStatus(-5);
      expect(result).toBe("Out of Stock");
    });
  
    it('should handle large quantities and still return "In Stock"', () => {
      const result = getStockStatus(1_000_000);
      expect(result).toBe("In Stock");
    });
  });
  import { MorRItems,ItemProduct} from "../../../src/types/ai.types";
import { OndcCatalogue } from ".../../../src/types/ondcStore.types"; describe("parseMatchingProductMetadata", () => {
    it("should return product metadata when it exists", () => {
      const sourceItem: MorRItems = {
        productId: "prod-001",  
        matchReason: "Best match",  
        product: {
          id: "123",
          kikoId: "kiko-001",
          lastUpdated: new Date().toISOString(),
          storeId: "store-001",
          createdAt: new Date().toISOString(),
          metadata: {
            l3: "value1",
            l4: "value2",
            __v: 1,
            _id: "some-id",
          } as OndcCatalogue,
        } as ItemProduct,
      };
  
      expect(parseMatchingProductMetadata(sourceItem)).toEqual({
        l3: "value1",
        l4: "value2",
        __v: 1,
        _id: "some-id",
      });
    });
  
    it("should return null when product metadata does not exist", () => {
      const sourceItem: MorRItems = {
        productId: "prod-002",  
        matchReason: "Similar product",  
        product: {
          id: "123",
          kikoId: "kiko-002",
          lastUpdated: new Date().toISOString(),
          storeId: "store-002",
          createdAt: new Date().toISOString(),
        } as ItemProduct,
      };
  
      expect(parseMatchingProductMetadata(sourceItem)).toBeNull();
    });
  
    it("should return null when sourceItem is undefined", () => {
      expect(parseMatchingProductMetadata(undefined as any)).toBeNull();
    });
  
    it("should return null when sourceItem.product is undefined", () => {
      const sourceItem: MorRItems = {
        productId: "prod-003",  
        matchReason: "No match found", 
      } as MorRItems;
  
      expect(parseMatchingProductMetadata(sourceItem)).toBeNull();
    });

    it("should return null when sourceItem is an empty object", () => {
      const sourceItem: MorRItems = {} as MorRItems;
      expect(parseMatchingProductMetadata(sourceItem)).toBeNull();
    });

    it("should return an empty object when product metadata is empty", () => {
      const sourceItem: MorRItems = {
        productId: "prod-005",
        matchReason: "Moderate match",
        product: {
          id: "456",
          kikoId: "kiko-005",
          lastUpdated: new Date().toISOString(),
          storeId: "store-005",
          createdAt: new Date().toISOString(),
          metadata: {},
        } as ItemProduct,
      };
  
      expect(parseMatchingProductMetadata(sourceItem)).toEqual({});
    });
  
  
  
   
    it("should return product metadata even if it contains unexpected fields", () => {
      const sourceItem: MorRItems = {
        productId: "prod-008",
        matchReason: "High match confidence",
        product: {
          id: "777",
          kikoId: "kiko-008",
          lastUpdated: new Date().toISOString(),
          storeId: "store-008",
          createdAt: new Date().toISOString(),
          metadata: {
            unexpectedField: "unexpectedValue",
            l3: "level3Data",
          } as any,
        } as ItemProduct,
      };
    
      expect(parseMatchingProductMetadata(sourceItem)).toEqual({
        unexpectedField: "unexpectedValue",
        l3: "level3Data",
      });
    });
    
  });

  it("should return metadata even if sourceItem has extra properties", () => {
    const sourceItem: MorRItems & { extraProp: string } = {
      productId: "prod-007",
      matchReason: "Best seller",
      extraProp: "some extra data",
      product: {
        id: "101",
        kikoId: "kiko-007",
        lastUpdated: new Date().toISOString(),
        storeId: "store-007",
        createdAt: new Date().toISOString(),
        metadata: {
          l3: "categoryA",
          l4: "categoryB",
          _id: "meta-002",
        } as OndcCatalogue,
      } as ItemProduct,
    };
  
    expect(parseMatchingProductMetadata(sourceItem)).toEqual({
      l3: "categoryA",
      l4: "categoryB",
      _id: "meta-002",
    });
 
  it("should return null when product metadata is explicitly null", () => {
    const sourceItem: MorRItems = {
      productId: "prod-006",
      matchReason: "Low confidence match",
      product: {
        id: "789",
        kikoId: "kiko-006",
        lastUpdated: new Date().toISOString(),
        storeId: "store-006",
        createdAt: new Date().toISOString(),
        metadata: null,
      } as ItemProduct,
    };
  
    expect(parseMatchingProductMetadata(sourceItem)).toBeNull();
  });
});