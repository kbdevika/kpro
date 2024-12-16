export type UserAddress = {
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
    addressType: string;
    address_line1: string;
    address_line2: string;
    street: string;
    country: string;
    landmark: string;
    contactName?: string;
    contactPhone?: string;
  };