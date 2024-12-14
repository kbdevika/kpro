import { Catalogue, StoreAddress } from "./ondcStore.type";

type TaskResult = {
    taskId: string;
    state: string;
    progress: number;
    result: Result;
  };

type OriginalItems = {
    name: string;
    quantity: number;
    unit: string;
  };

type Items = {
    name: string;
    quantity: number;
    unit: string;
    metadata: {
      matching: {
        productId: string;
        confidence: string;
        matchReason: string;
        product: {
          id: string;
          kikoId: string;
          metadata: {
            __v: number;
            _id: string;
            gst: number;
            tax: number;
            brand: string;
            price: string;
            menuId: string;
            status: string;
            userId: string;
            weight: number;
            isCustom: boolean;
            createdAt: string;
            isDeleted: boolean;
            productId: string;
            updatedAt: string;
            bulkUpload: boolean;
            categoryId: string;
            weightUnit: string;
            description: string;
            productName: string;
            isReturnable: boolean;
            packagedFood: boolean;
            restaurantId: string;
            customGroupId: string;
            isCancellable: boolean;
            packagingCost: number;
            productImages: string[];
            subCategoryId: string;
            petpoojaItemId: string;
            countryOfOrigin: string;
            discountedPrice: string;
            mainRestaurantId: string;
            availableQuantity: string;
            childCustomGroupId: string[];
            petpoojaAddonitemId: string;
            petpoojaVariationId: string;
            statutory_reqs_packaged_commodities: {
              manufacturer_or_packer_name: string;
              manufacturer_or_packer_address: string;
              imported_product_country_of_origin: string;
              common_or_generic_name_of_commodity: string;
              month_year_of_manufacture_packing_import: string;
              net_quantity_or_measure_of_commodity_in_pkg: string;
            };
          };
          lastUpdated: string;
          storeId: string;
          createdAt: string;
        };
      };
      recommendations: Array<{
        productId: string;
        reason: string;
        product: {
          id: string;
          kikoId: string;
          metadata: {
            __v: number;
            _id: string;
            gst: number;
            tax: number;
            brand: string;
            price: string;
            menuId: string;
            status: string;
            userId: string;
            weight: number;
            isCustom: boolean;
            createdAt: string;
            isDeleted: boolean;
            productId: string;
            updatedAt: string;
            bulkUpload: boolean;
            categoryId: string;
            weightUnit: string;
            description: string;
            productName: string;
            isReturnable: boolean;
            packagedFood: boolean;
            restaurantId: string;
            customGroupId: string;
            isCancellable: boolean;
            packagingCost: number;
            productImages: string[];
            subCategoryId: string;
            petpoojaItemId: string;
            countryOfOrigin: string;
            discountedPrice: string;
            mainRestaurantId: string;
            availableQuantity: string;
            childCustomGroupId: string[];
            petpoojaAddonitemId: string;
            petpoojaVariationId: string;
            statutory_reqs_packaged_commodities: {
              manufacturer_or_packer_name: string;
              manufacturer_or_packer_address: string;
              imported_product_country_of_origin: string;
              common_or_generic_name_of_commodity: string;
              month_year_of_manufacture_packing_import: string;
              net_quantity_or_measure_of_commodity_in_pkg: string;
            };
          };
          lastUpdated: string;
          storeId: string;
          createdAt: string;
        };
      }>;
    };
  };

type Result = {
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
      storeAddress: StoreAddress
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

  export {
    Items
  }
  export default TaskResult;