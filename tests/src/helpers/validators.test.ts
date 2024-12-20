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