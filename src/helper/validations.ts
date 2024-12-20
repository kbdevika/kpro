const isValidFloat = (value: string): boolean => {
    const parsed = parseFloat(value);
    return !Number.isNaN(parsed);
  };
  
  const isValidInt = (value: string): boolean => {
    const parsed = parseInt(value, 10);
    return !Number.isNaN(parsed);
  };

export {
    isValidFloat,
    isValidInt
}

export default isValidInt