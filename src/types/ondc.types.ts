export type Context = {
    domain: string;
    action: string; // e.g., "search", "select", "init", "confirm"
    country: string; // ISO Country Code, e.g., "IND"
    city: string; // City Code, e.g., "std:080"
    core_version: string; // e.g., "1.0.1"
    bap_id: string; // Buyer App ID
    bap_uri: string; // Buyer App callback URI
    bpp_id?: string; // Seller App ID (optional in some requests)
    bpp_uri?: string; // Seller App callback URI (optional in some requests)
    transaction_id: string; // Unique for each transaction
    message_id: string; // Unique for request/callback
    timestamp: string; // RFC3339 timestamp
    key?: string; // Encryption public key
    ttl?: string; // Time-to-live for the message
}


export type Intent = {
    descriptor?: Descriptor;
    provider?: Provider;
    fulfillment?: Fulfillment;
    payment?: Payment;
    category?: Category;
    offer?: Offer;
    item?: Item;
    tags?: Tags;
}

export type Order = {
    id?: string; // Unique order ID (generated post-confirmation)
    state?: string // State of the order
    transaction_id?: string; // Unique transaction ID (mandatory for APIs like /init)
    provider: {
        id: string; // ID of the provider
        locations?: { id: string }[]; // Locations associated with the provider
    };
    items: {
        id: string; // Item ID (from catalog)
        quantity: {
            count: number; // Quantity of the item (must be >= 1)
        };
    }[];
    add_ons?: { id: string }[]; // IDs of add-ons selected for items
    offers?: { id: string }[]; // IDs of offers applied to the order
    documents?: Document[]; // Associated documents (e.g., invoices, receipts)
    billing?: Billing; // Billing details (required for /init)
    fulfillment?: Fulfillment; // Fulfillment details (delivery or pickup)
    quote?: Quotation; // Price quote details for the order
    payment?: Payment; // Payment information (optional for /init)
    created_at?: string; // ISO8601 timestamp of order creation
    updated_at?: string; // ISO8601 timestamp of last update
};


export type Ack = {
    status: "ACK" | "NACK";
}

export type Error = {
    type: string;
    code: string;
    path?: string; // Path to the schema generating the error
    message: string; // Human-readable error description
}

export type Descriptor = {
    name?: string;
    code?: string;
    symbol?: string;
    short_desc?: string;
    long_desc?: string;
    images?: string[]; // URLs of images
    audio?: string; // URL of audio
    "3d_render"?: string; // URL of 3D render
}

export type Tags = Record<string, string>; // Key-value metadata

export type Provider = {
    id: string;
    descriptor?: Descriptor;
    category_id?: string;
    rating?: number;
    time?: Time;
    categories?: Category[];
    fulfillments?: Fulfillment[];
    payments?: Payment[];
    locations?: Location[];
    offers?: Offer[];
    items?: Item[];
    exp?: string; // Expiry timestamp
    rateable?: boolean;
    tags?: Tags;
}

export type Category = {
    id: string;
    parent_category_id?: string;
    descriptor?: Descriptor;
    time?: Time;
    tags?: Tags;
}

export type Fulfillment = {
    id?: string;
    type?: string;
    provider_id?: string;
    tracking?: boolean;
    customer?: {
        person?: Person;
        contact?: Contact;
    };
    start?: {
        location?: Location;
        time?: Time;
        instructions?: Descriptor;
    };
    end?: {
        location?: Location;
        time?: Time;
        instructions?: Descriptor;
    };
    tags?: Tags;
}

export type Location = {
    id?: string;
    descriptor?: Descriptor;
    gps?: string; // Latitude,Longitude
    address?: Address;
    city?: City;
    country?: Country;
    time?: Time;
}

export type Address = {
    door?: string;
    name?: string;
    building?: string;
    street?: string;
    locality?: string;
    ward?: string;
    city: string;
    state: string;
    country: string;
    area_code: string; // e.g., Pincode
}

export type Billing = {
    name: string;
    organization?: Organization;
    address?: Address;
    email?: string;
    phone: string;
    tax_number?: string;
    created_at?: string;
    updated_at?: string;
}

export type Payment = {
    uri?: string; // Payment URL
    tl_method?: string;
    params?: {
        transaction_id?: string;
        transaction_status?: string;
        amount?: number;
        currency?: string; // ISO 4217 currency code
    };
    type?: string;
    status?: "PAID" | "NOT-PAID";
}

export type Quotation = {
    price?: Price;
    breakup?: {
        title?: string;
        price?: Price;
    }[];
    ttl?: string; // ISO8601 duration
}

export type Price = {
    currency: string; // e.g., "INR"
    value: string; // Decimal value as string
    estimated_value?: string;
    computed_value?: string;
    listed_value?: string;
    offered_value?: string;
}

export type Time = {
    label?: string;
    timestamp?: string; // ISO8601
    duration?: string; // ISO8601 duration
    range?: {
        start: string;
        end: string;
    };
}

export type Document = {
    url: string;
    label?: string;
}

export type Offer = {
    id: string; // Unique ID of the offer
    descriptor?: Descriptor; // Description of the offer
    location_ids?: string[]; // Associated location IDs
    category_ids?: string[]; // Associated category IDs
    item_ids?: string[]; // Associated item IDs
    time?: Time; // Offer validity period
}

export type Item = {
    id?: string; // Unique identifier (e.g., SKU of a product)
    parent_item_id?: string; // ID of the parent item, if any
    descriptor?: Descriptor; // Description of the item
    price?: Price; // Price details
    category_id?: string; // Associated category ID
    fulfillment_id?: string; // Associated fulfillment ID
    location_id?: string; // Associated location ID
    rating?: number; // Rating of the item
    time?: Time; // Time details for the item
    tags?: Tags; // Additional metadata
    rateable?: boolean; // Indicates if the item can be rated
}

export type Person = {
    name?: string; // Name of the person
    image?: string; // URL of the person's image
    dob?: string; // Date of birth in ISO8601 format
    gender?: string; // Gender (e.g., "Male", "Female", or others)
    cred?: string; // Credentials or identifiers
    tags?: Tags; // Additional metadata
}

export type Contact = {
    phone?: string; // Contact phone number
    email?: string; // Contact email address
    tags?: Tags; // Additional metadata
}

export type Organization = {
    name?: string; // Name of the organization
    cred?: string; // Credential or identifier for the organization
}

export type City = {
    name?: string; // Name of the city
    code?: string; // Standardized city code (e.g., "std:080" for Bengaluru)
}

export type Country = {
    name?: string; // Name of the country
    code?: string; // ISO 3166 Alpha-3 country code (e.g., "IND" for India)
}

export type SearchRequest = {
    context: Context; // Context of the API request
    message: {
        intent: Intent; // Intent of the search request
    };
}

export type OnSearchRequest = {
    context: Context; // Metadata about the transaction
    message: {
        catalog: Catalog; // Catalog sent by the Seller App
    };
};

export type Catalog = {
    bpp_descriptor?: Descriptor; // Description of the BPP (Seller App providing the catalog)
    bpp_providers?: Provider[]; // List of providers (e.g., stores or service providers)
    bpp_categories?: Category[]; // Categories available in the catalog
    bpp_fulfillments?: Fulfillment[]; // Fulfillment options (e.g., delivery, pickup)
    bpp_offers?: Offer[]; // Offers provided by the BPP (applicable to items or providers)
    bpp_payments?: Payment[]; // Payment options supported by the BPP
    exp?: string; // Expiry timestamp for the catalog (ISO8601 format)
};

export type OnSelectRequest = {
    context: Context; // Metadata about the transaction
    message: OnSelectMessage; // Contains the order or error
};

export type OnSelectMessage = {
    order: Order; // The updated order object returned by the Seller App
    error?: Error; // Optional: Error details if the request failed
};

export type OnInitMessage = {
    order: Order; // The updated order object returned by the Seller App
    error?: Error; // Optional: Error details if the request failed
};

export type OnInitRequest = {
    context: Context; // Metadata about the transaction
    message: OnInitMessage; // Contains the order or error
};

export type ConfirmRequest = {
    order: Order; // Finalized order details
};

export type OnConfirmMessage = {
    order: Order; // The confirmed order object
    error?: Error; // Optional: Error details if the confirmation failed
};

export type OnConfirmRequest = {
    context: Context; // Metadata about the transaction
    message: OnConfirmMessage; // Contains the confirmed order or an error
};





