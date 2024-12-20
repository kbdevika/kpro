import { calculatePrices, getStockStatus } from '../../../src/helper/aiToCartMapper';
import aiResponse from '../../mockdatasets/aiResponse.json';

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
  