import validateHeaders from "../../../src/helper/validateHeader";
import isValidInt, { isValidFloat } from "../../../src/helper/validations";

describe('validators', () => {
    it('validating if a given string is float number or not', () => {
        expect(isValidFloat('1.33')).toBe(true);
    });

    it('validating if a given string is float number or not', () => {
        expect(isValidFloat('a')).toBe(false);
    });

    it('validating if a given string is int number or not', () => {
        expect(isValidInt('1')).toBe(true);
    });

    it('validating if a given string is int number or not', () => {
        expect(isValidInt('a')).toBe(false);
    });
})

describe('validateHeaders', () => {
  test('should return null if userAgent does not include "lat:"', () => {
    const userAgent = 'CustomAgent/1.0 (lon: 12.34567)';
    expect(validateHeaders(userAgent)).toBeNull();
  });

  test('should return null if userAgent does not include "lon:"', () => {
    const userAgent = 'CustomAgent/1.0 (lat: 12.34567)';
    expect(validateHeaders(userAgent)).toBeNull();
  });

  test('should return null if userAgent does not match the expected pattern', () => {
    const userAgent = 'CustomAgent/1.0 (latitude: 12.34567; longitude: 76.54321)';
    expect(validateHeaders(userAgent)).toBeNull();
  });

  test('should return null if "lat:" and "lon:" values are invalid numbers', () => {
    const userAgent = 'CustomAgent/1.0 (lat: abc; lon: xyz)';
    expect(validateHeaders(userAgent)).toBeNull();
  });

  test('should return parsed latitude and longitude if userAgent is valid', () => {
    const userAgent = 'CustomAgent/1.0 (lat: 12.34567; lon: 76.54321)';
    expect(validateHeaders(userAgent)).toEqual({
      latitude: 12.34567,
      longitude: 76.54321,
    });
  });

  test('should handle extra spaces in the userAgent correctly', () => {
    const userAgent = 'CustomAgent/1.0 (lat:   12.34567  ; lon:   76.54321 )';
    expect(validateHeaders(userAgent)).toEqual({
      latitude: 12.34567,
      longitude: 76.54321,
    });
  });

  test('should handle negative latitude and longitude values', () => {
    const userAgent = 'CustomAgent/1.0 (lat: -12.34567; lon: -76.54321)';
    expect(validateHeaders(userAgent)).toEqual({
      latitude: -12.34567,
      longitude: -76.54321,
    });
  });

  test('should handle latitude and longitude values with no decimal points', () => {
    const userAgent = 'CustomAgent/1.0 (lat: 12; lon: 76)';
    expect(validateHeaders(userAgent)).toEqual({
      latitude: 12,
      longitude: 76,
    });
  });
});
