type OndcStatutoryReqsPackagedCommodities =   {
  manufacturer_or_packer_name: string;
  manufacturer_or_packer_address: string;
  imported_product_country_of_origin: string;
  common_or_generic_name_of_commodity: string;
  month_year_of_manufacture_packing_import: string;
  net_quantity_or_measure_of_commodity_in_pkg: string;
};

  type OndcStoreAddress = {
    pincode: number;
    address1: string;
    address2: string;
    nearBy: string;
    state: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    contactPersonName: string;
    contactPersonMobile: string;
  };
  
  type OndcOrderServiceability = {
    freeDelivery: boolean;
    freeDeliveryMinValue: number;
    panIndiaDelivery: boolean;
    panIndiaDeliveryCharges: number;
    dayTimeTat: string;
    nightTimeTat: string;
  };
  
  type OndcStoreTiming = {
    availability: string[];
    holidays: string[];
    storeTime: string[];
    breakTime: string[];
  };
  
  type OndcCatalogue = {
    l3: string;
    l4: string;
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
    statutory_reqs_packaged_commodities: OndcStatutoryReqsPackagedCommodities
  };
  
  
  type OndcStore = {
    _id: string;
    id: string;
    name: string;
    phone: string;
    mobile: string;
    storeStatus: string;
    storeImages: string[];
    deliveryRadius: number;
    ondcVerified: boolean;
    email: string;
    fssaiLicense: string;
    storeAddress: OndcStoreAddress;
    storeLogo: string;
    storeName: string;
    storeTiming: OndcStoreTiming;
    ondcOrderServiceability: OndcOrderServiceability;
    cataloguesArray: OndcCatalogue[];
  };

  export { 
    OndcStore, 
    OndcStatutoryReqsPackagedCommodities,
    OndcCatalogue,
    OndcStoreTiming,
    OndcOrderServiceability,
    OndcStoreAddress
  }

  export default OndcStore