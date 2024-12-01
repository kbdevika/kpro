import prisma from "../config/prisma.config";
import Store from "../types/ondcStore.type";

export default async function fetchCatalogue(pincode: string): Promise<Store[]> {
  // Ensure the pincode is provided
  if (!pincode) {
    throw new Error('Pincode is not available');
  }

  try {
    // Store the fetched catalogue in the database
    const newCatalogue = await prisma.catalogue.findUnique({
      where: {
        pincode: `${pincode}`, 
      }
    });

    if(newCatalogue){
      const storeData: Store[] = newCatalogue.jsonData as Store[] || [];      
      return storeData
    }
    return []

  } catch (error: any) {
    throw new Error(`Error fetching catalogue: ${error.message}`);
  }
}
