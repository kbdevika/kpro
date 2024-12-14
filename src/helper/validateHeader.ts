
// Helper function to validate User and User-Agent header
const validateHeaders = (userAgent: string | undefined): { latitude: number; longitude: number } | null => {
    /**
     * Check for UserAgent in incoming Request with latitude and 
     * longitude of current location of user
     */
    if (!userAgent || !userAgent.includes('lat:') || !userAgent.includes('lon:')) {
      return null;
    }

    /**
     * REGEX pattern to compare with -
     * <CustomAgent/x.0 (lat: xx.xxxxx; lon: xx.xxxxx)>
     */
    const latLonRegex = /lat:\s*([\d.-]+);\s*lon:\s*([\d.-]+)/;
    const match = userAgent.match(latLonRegex);
    if (!match) return null;
  
    /**
     * Latitude and Longitude might be String,
     * Parse it into Float and return it
     */
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    return { latitude, longitude };
  };

export default validateHeaders;