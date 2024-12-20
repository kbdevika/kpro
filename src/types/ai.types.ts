import { OndcCatalogue, OndcStoreAddress } from "./ondcStore.types";

export type TaskResult = {
    taskId: string;
    state: string;
    progress: number;
    result: Result;
  };

export type OriginalItems = {
    name: string;
    quantity: number;
    unit: string;
  };

export type ItemsMetadata = {
    matching: MorRItems;
    recommendations: MorRItems[];
}

export type MorRItems = {
  productId: string;
  confidence?: string;
  matchReason: string;
  product: ItemProduct;
};

export type ItemProduct = {
  id: string;
  kikoId: string;
  metadata: OndcCatalogue;
  lastUpdated: string;
  storeId: string;
  createdAt: string;
}

export type Items = {
    name: string;
    quantity: number;
    unit: string;
    metadata: ItemsMetadata
  };

export type Result = {
    storeId: string;
    storeData: {
      id: string;
      _id: string;
      name: string;
      email: string;
      phone: string;
      mobile: string;
      storeLogo: string;
      storeName: string;
      description: string;
      storeImages: string[];
      storeStatus: string;
      storeTiming: {
        holidays: string[];
        breakTime: string[];
        storeTime: string[];
        availability: string[];
      };
      fssaiLicense: string;
      ondcVerified: boolean;
      storeAddress: OndcStoreAddress;
      deliveryRadius: number;
      ondcOrderServiceability: {
        dayTimeTat: string;
        freeDelivery: boolean;
        nightTimeTat: string;
        panIndiaDelivery: boolean;
        freeDeliveryMinValue: number;
        panIndiaDeliveryCharges: number;
      };
    };
    items: Items[];
    completeness: number;
    originalItems: OriginalItems[];
  };

export default TaskResult;