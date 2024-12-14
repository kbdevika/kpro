
// Helper function to fetch JWT token
const fetchJwtToken = async (): Promise<string> => {
    /**
     * Check and Retrieve APIKEY from Environment Variable if it is Present,
     * else throw new error
     */
    const apiKey = process.env.AI_MICROSERVICE_API_KEY || '61c1fbd5-96da-4c6a-93a1-fc06dd4f71fe';
    if (!apiKey) throw new Error('AI Microservice API Key is not set.');

    /**
     * Create a new API call with APIKEY to fetch a JWT Token
     * used for further Audio Process;
     */
    const loginResponse = await fetch('https://dev-ai-api.kpro42.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
  
    if (!loginResponse.ok) {
      throw new Error('Failed to fetch JWT token. Check your API key.');
    }
  
    const loginData = await loginResponse.json();
    return loginData.token;
  };

export default fetchJwtToken;