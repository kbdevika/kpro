import prisma from "../config/prisma.config";
import Store from "../types/ondcStore.type";

export default async function fetchCatalogue(pincode: string): Promise<Store[]> {
  // Ensure the pincode is provided
  if (!pincode) {
    throw new Error('Pincode is not available');
  }

  try {
    // Fetch from the external API if not present
    const response = await fetch('https://ondc-api.kiko.live/ondc-seller-v2/kiranaProSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pincode: parseInt(pincode) }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch catalogue from API: ${response.statusText}`);
    }

    const data = await response.json();
    const storeData: Store[] = data;

    // Store the fetched catalogue in the database
    const newCatalogue = await prisma.catalogue.upsert({
      where: {
        pincode: pincode,  // Assuming 'pincode' is unique for each catalogue
      },
      update: {
        jsonData: storeData,  // If the catalogue exists, update its jsonData
      },
      create: {
        pincode: pincode,  // If the catalogue doesn't exist, create a new one
        jsonData: storeData,
      },
    });
    return data;

  } catch (error: any) {
    throw new Error(`Error fetching catalogue: ${error.message}`);
  }
}
