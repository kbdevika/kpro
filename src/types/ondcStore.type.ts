type StatutoryReqsPackagedCommodities = {
    manufacturer_or_packer_name: string;
    manufacturer_or_packer_address: string;
    common_or_generic_name_of_commodity: string;
    net_quantity_or_measure_of_commodity_in_pkg: string;
    month_year_of_manufacture_packing_import: string;
    imported_product_country_of_origin: string;
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
    _id: string;
    isCancellable: boolean;
    isReturnable: boolean;
    itemLevelDeliveryCharges: string;
    maxAvailableQuantity: string;
    productImages: string[];
    isDeleted: boolean;
    packagedFood: boolean;
    tax: number;
    gst: number;
    packagingCost: number;
    bulkUpload: boolean;
    productId: string;
    status: string;
    userId: string;
    categoryId: string;
    subCategoryId: string;
    code: string;
    productName: string;
    availableQuantity: string;
    weightUnit: string;
    price: string;
    discountedPrice: string;
    description: string;
    skuCode: string;
    countryOfOrigin: string;
    weight: string;
    brand: string;
    statutory_reqs_packaged_commodities: StatutoryReqsPackagedCommodities;
    __v: number;
    createdAt: string;
    updatedAt: string;
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

  export default Store