import { AI_BASE_URL } from "../constants";

// Helper function to fetch JWT token
const fetchJwtToken = async (): Promise<string> => {
    /**
     * Check and Retrieve APIKEY from Environment Variable if it is Present,
     * else throw new error
     */
    const apiKey = process.env.AI_MICROSERVICE_API_KEY || '4359fcbc-86e6-4020-a96d-c5636e539603';
    if (!apiKey) throw new Error('AI Microservice API Key is not set.');

    /**
     * Create a new API call with APIKEY to fetch a JWT Token
     * used for further Audio Process;
     */
    const loginResponse = await fetch(`${AI_BASE_URL}/api/auth/login`, {
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