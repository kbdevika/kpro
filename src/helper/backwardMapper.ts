import { CartItemsModelType, CartModelType, CouponModelType, ExposedCouponModel, OrderResponse, UserAddressModelType } from "../types/database.types"
import { _AddressType, _CartReponseItem, _CartResponseType, _OrderResponse } from "../types/backwardCompatibility.types"
import { couponApplier } from "./discountMapper";

const cartItemMapper = (cartItems: CartItemsModelType[]): _CartReponseItem[] => {
    const data = cartItems.map((items: CartItemsModelType) => {
        return {
            itemId: items.id || '', // Use a fallback if `items.id` is undefined
            ...items,
            itemImageUrl: Array.isArray(items.itemImageUrl) ? items.itemImageUrl : [items.itemImageUrl],
        };
    });
    return data;
};

export const cartMapper = (cartId: string, cart: CartModelType, coupon: CouponModelType | null): _CartResponseType => {
    return {
        orderSummary: {
            deliveryCharges: cart.cartDeliveryCharges,
            deliverytime: `${cart.cartDeliverytime} minutes`,
            discount: cart.cartDiscount,
            freeDeliveryThreshold: cart.cartFreeDeliveryThreshold,
            saved: cart.cartSavingsMessage,
            subTotal: cart.cartSubTotal,
            total: couponApplier(cart, coupon).discountedTotal,
        },
        additionalInfo: {
            cartNote: cart.cartNote,
            savingsMessage: cart.cartSavingsMessage
        },
        aiStoreId: cart.cartaiStoreId,
        cartId: cartId,
        items: cartItemMapper(cart.cartItems
            ? cart.cartItems.filter((a) => a.itemRecommended === false)
            : []),
        recommendedItems: cartItemMapper(cart.cartItems
            ? cart.cartItems.filter((a) => a.itemRecommended === true)
            : []),
        storeInfo: {
            storeAddress: cart.cartStoreAddress,
            storeName: cart.cartStoreName,
            storeContactPerson: cart.cartStoreContact,
            storePhone: cart.cartStorePhone
        },
        coupon: { ...couponApplier(cart, coupon).exposedCoupon }
    }
}

export const addressMapper = (address: UserAddressModelType): _AddressType => {
    return {
        id: address.id || '',
        address_line1: address.addressLine1,
        address_line2: address.addressLine2,
        street: address.addressStreet,
        city: address.addressCity,
        state: address.addressState,
        country: address.addressCountry,
        latitude: address.addressLatitude,
        longitude: address.addressLongitude,
        addressType: address.addressAddressType,
        landmark: address.addressLandmark,
        postalCode: address.addressPostalCode.toString()
    }
}

export const addressResponseMapper = (userId: string, address: _AddressType, name: string, phone: string): UserAddressModelType => {
    return {
        addressLine1: address.address_line1,
        addressLine2: address.address_line2,
        addressStreet: address.street,
        addressCity: address.city,
        addressState: address.state,
        addressCountry: address.country,
        addressLatitude: address.latitude,
        addressLongitude: address.longitude,
        addressAddressType: address.addressType,
        addressLandmark: address.landmark,
        addressPostalCode: parseInt(address.postalCode),
        addressContactName: name,
        addressContactPhone: phone,
        userId: userId
    }
}

export const orderMapper = (order: OrderResponse): _OrderResponse | null => {

    if (order.cart.id) {
        const cart = cartMapper(order.cart.id, order.cart, null)
        const address = addressMapper(order.address);
        return {
            address: address,
            cart: cart,
            id: order.id,
            phone: order.address.addressContactPhone,
            createdDate: order.createdDate.toISOString(),
            orderDeliveryStatus: order.orderDeliveryStatus,
            orderStatus: order.orderStatus,
            endOTP: order.endOTP,
            riderName: order.riderName,
            riderPhone: order.riderPhone,
            trackingURL: order.trackingURL,
            userId: order.userId
        }
    }
    return null
}