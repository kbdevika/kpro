import { CartItems } from "../types/cart.type";
import { OrderResponse, OrderSummaryResponse } from "../types/order.type";

export default function convertToOrderSummary(_order: OrderResponse): OrderSummaryResponse {

    // Filter out items with `recommended` as `true` and calculate `subTotal`
    let { items, subTotal } = _order.cart.items.reduce(
        (acc: { items: CartItems[]; subTotal: number }, item: CartItems) => {
        if (item.recommended === true) {
            return acc;
        }
        acc.items.push(item);
        acc.subTotal += item.price * item.quantity;
        return acc;
        },
        { items: [], subTotal: 0 }
    );

    const deliveryCharges = 35;
    const total = subTotal + deliveryCharges;
    
    const _orderSummary: OrderSummaryResponse = {
    orderId: _order.id,
    cart: {
        cartId: _order.cart.id,
        items: items,
    },
    orderSummary: {
        subTotal: subTotal,
        total: total,
        payment: _order.status,
    },
    storeInfo: {
        storeName: _order.storeName,
    },
    additionalInfo: {
        savingsMessage: ``,
        cartNote: ``,
    },
    };      

    return _orderSummary

}