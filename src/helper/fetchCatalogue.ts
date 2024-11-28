import prisma from "../config/prisma.config";
import Store from "../types/ondcStore.type";

export default async function fetchCatalogue(pincode: string): Promise<Store[]> {
  // Ensure the pincode is provided
  if (!pincode) {
    throw new Error('Pincode is not available');
  }

  try {
    // Check if the catalogue for the pincode exists in the database
    const existingCatalogue = await prisma.catalogue.findUnique({
      where: { pincode },
    });

    if (existingCatalogue) {
      // If present, return the catalogue from the database
      return existingCatalogue.jsonData as Store[];
    }

    // Fetch from the external API if not present
    const response = await fetch('https://ondc-api.kiko.live/ondc-seller-v2/kiranaProSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pincode }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch catalogue from API: ${response.statusText}`);
    }

    const data = await response.json();
    const storeData: Store[] = data;

    // Store the fetched catalogue in the database
    const newCatalogue = await prisma.catalogue.create({
      data: {
        pincode,
        jsonData: storeData,
      },
    });
    return storeData;

  } catch (error: any) {
    throw new Error(`Error fetching catalogue: ${error.message}`);
  }
}
