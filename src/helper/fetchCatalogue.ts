import prisma from "../config/prisma.config";
import Store, { Catalogue } from "../types/ondcStore.type";
import demo from '../../demo.json'

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

    const demoData = demo as { id: string; pincode: string; jsonData: Store[]; createdAt: string }

    if(newCatalogue){
      const storeData: Store[] = newCatalogue.jsonData as Store[] || [];      
      return storeData
    }
    return demoData.jsonData

  } catch (error: any) {
    throw new Error(`Error fetching catalogue: ${error.message}`);
  }
}
