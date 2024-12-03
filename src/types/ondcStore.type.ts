type StatutoryReqsPackagedCommodities =   {
  manufacturer_or_packer_name: string;
  manufacturer_or_packer_address: string;
  imported_product_country_of_origin: string;
  common_or_generic_name_of_commodity: string;
  month_year_of_manufacture_packing_import: string;
  net_quantity_or_measure_of_commodity_in_pkg: string;
};

  type StoreAddress = {
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
  
  type StoreTiming = {
    availability: string[];
    holidays: string[];
    storeTime: string[];
    breakTime: string[];
  };
  
  type Catalogue = {
    l3: string;
    l4: string;
    __v: number;
    _id: string;
    gst: number;
    tax: number;
    brand: string;
    price: string;
    status: string;
    userId: string;
    weight: number;
    skuCode: string;
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
    isCancellable: boolean;
    packagingCost: number;
    productImages: string[];
    subCategoryId: string;
    countryOfOrigin: string;
    discountedPrice: string;
    availableQuantity: string;
    statutory_reqs_packaged_commodities: StatutoryReqsPackagedCommodities
    requiredQuantity?: number;
  };
  
  
  type Store = {
    _id: string;
    ondcOrderServiceability: OndcOrderServiceability;
    phone: string;
    mobile: string;
    storeStatus: string;
    storeImages: string[];
    deliveryRadius: number;
    ondcVerified: boolean;
    email: string;
    fssaiLicense: string;
    name: string;
    storeAddress: StoreAddress;
    storeLogo: string;
    storeName: string;
    storeTiming: StoreTiming;
    id: string;
    cataloguesArray: Catalogue[];
  };

  export { 
    Store, 
    StatutoryReqsPackagedCommodities,
    Catalogue,
    StoreTiming,
    OndcOrderServiceability,
    StoreAddress
  }

  export default Store