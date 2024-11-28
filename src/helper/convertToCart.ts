import getPincodeFromCoordinates from "./convertLatLongToPincode";
import fetchCatalogue from "./fetchCatalogue";
import searchCatalogue from "./searchCatalogue";

type GroceryData = {
    items: {
      name: string;
      quantity: number;
      unit: string;
    }[];
    processingTime: number;
  };

  type CartResponse = {
    message: string;
    deliverytime: string;
    saved: string;
    cart: {
      id: string;
      items: {
        id: string;
        name: string;
        price: number;
        quantity: number;
        unit: string;
        image: string;
      }[];
      orderSummary: {
        items: {
          id: string;
          name: string;
          price: number;
          amount: number;
          quantity: number;
          unit: string;
          image: string;
        }[];
        subTotal: number;
        shipping: number;
        discount: number;
        total: number;
      };
    };
  };
  
  type Product = {
    productId: string;
    productName: string;
    productImage: string;
    productPrice: string;
    discountedPrice: string;
    storeId: string;
  };

  export default async function convertToCart(
    data: GroceryData,
    latitude: number,
    longitude: number
): Promise<CartResponse> {
    const pincode = await getPincodeFromCoordinates(latitude, longitude);
    const catalogue = await fetchCatalogue(pincode);

    if (!catalogue || catalogue.length === 0) {
      throw new Error(`The pincode ${pincode} is not serviceable`);
    }

    // Initialize an empty array to hold the selected products
    const selectedProducts: Product[] = [];

    // Iterate over the items and search for the best available product in the catalogue
    for (const item of data.items) {
        const bestProduct = searchCatalogue(item.name, latitude, longitude, catalogue);
        if (bestProduct) {
            selectedProducts.push(bestProduct);
        }
    }

    // Map selectedProducts into CartResponse
    const cartItems = selectedProducts.map((product, index) => {
        const originalPrice = parseFloat(product.productPrice);
        const discountedPrice = parseFloat(product.discountedPrice);

        return {
            id: product.productId,
            name: product.productName,
            price: discountedPrice,
            quantity: data.items[index].quantity,
            unit: data.items[index].unit,
            image: product.productImage,
        };
    });

    // Calculate order summary
    let subTotal = 0;
    let totalSavedAmount = 0;

    const orderItems = cartItems.map((item) => {
        const amount = item.price
        const originalAmount = parseFloat(selectedProducts.find((p) => p.productId === item.id)!.productPrice);

        subTotal += amount;
        totalSavedAmount += originalAmount - amount;

        return {
            id: item.id,
            name: item.name,
            price: item.price,
            amount,
            quantity: 1,
            unit: item.unit,
            image: item.image,
        };
    });

    const shipping = subTotal >= 199 ? 0 : 27;
    const total = subTotal + shipping;

    // Construct the CartResponse
    const cartResponse: CartResponse = {
        message: "Cart successfully created",
        deliverytime: `${data.processingTime} minutes`,
        saved: `₹${totalSavedAmount.toFixed(2)}`,
        cart: {
            id: `cart_${Date.now()}`,
            items: cartItems,
            orderSummary: {
                items: orderItems,
                subTotal: subTotal,
                shipping,
                discount: totalSavedAmount,
                total,
            },
        },
    };

    return cartResponse;
}