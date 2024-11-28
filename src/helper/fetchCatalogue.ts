export default async function fetchCatalogue(pincode: string) {
    // Ensure the request body contains `pincode`
  if (!pincode) {
    throw new Error('Pincode is not available')
  }

  try {
        // Fetch request to the external API
        const response = await fetch('https://ondc-api.kiko.live/ondc-seller-v2/kiranaProSearch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pincode }),
        });

        // Parse the response
        const data = await response.json();
        return data;
    } catch (error: any) {
        throw new Error(`Error: ${error.message}`)
    }
}