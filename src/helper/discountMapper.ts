import { CartModelType, CouponModelType, ExposedCouponModel } from "../types/database.types";

export default function calculateDiscountedTotal(
    total: number,
    discountType: string,
    discountValue: number
): number {
    let discountedTotal = total;

    if (discountType === 'PERCENTAGE') {
        // Deduct percentage of total
        discountedTotal = total - (total * discountValue) / 100;
    } else if (discountType === 'FLAT') {
        // Deduct flat amount
        discountedTotal = total - discountValue;
    } else if (discountType === 'FIXED') {
        // Fixed total amount (total does not affect this)
        discountedTotal = discountValue;
    } else {
        discountedTotal = total
    }

    // Ensure discountedTotal is not negative
    return Math.max(discountedTotal, 0);
}

export function couponApplier(cart: CartModelType, coupon: CouponModelType | null): { exposedCoupon: ExposedCouponModel, discountedTotal: number } {

    if (coupon === null) return {
        exposedCoupon: {
            message: 'No Coupons applied!',
            applied: false,
            discountedAmount: null,
            values: null
        },
        discountedTotal: cart.cartTotal
    }

    // Check if the coupon is expired
    const currentDate = new Date();

    if (coupon.startDate > currentDate) return {
        exposedCoupon: {
            message: 'You are not eligible for this offer. Please use another cheat code!',
            applied: false,
            discountedAmount: null,
            values: null
        },
        discountedTotal: cart.cartTotal
    }

    if (coupon.expiryDate < currentDate) return {
        exposedCoupon: {
            message: 'You are not eligible for this offer. Please use another cheat code!',
            applied: false,
            discountedAmount: null,
            values: null
        },
        discountedTotal: cart.cartTotal
    }

    // Check the cart total against the coupon's minimum and maximum order value
    if (cart.cartTotal < parseFloat(coupon.minimumOrderValue)) return {
        exposedCoupon: {
            message: `You are not eligible for this offer as you have is less than the minimum order value of ₹${coupon.minimumOrderValue}!`,
            applied: false,
            discountedAmount: null,
            values: null
        },
        discountedTotal: cart.cartTotal
    }

    if (coupon.maximumOrderValue && cart.cartTotal >= parseFloat(coupon.maximumOrderValue)) return {
        exposedCoupon: {
            message: `You are not eligible for this offer as you have already added items worth more than ₹${coupon.maximumOrderValue}!`,
            applied: false,
            discountedAmount: null,
            values: null
        },
        discountedTotal: cart.cartTotal
    }

    if (coupon.usageCount > coupon.usageLimit) return {
        exposedCoupon: {
            message: 'You are not eligible for this offer. Please use another cheat code!',
            applied: false,
            discountedAmount: null,
            values: null
        },
        discountedTotal: cart.cartTotal
    }

    const discountedTotal = calculateDiscountedTotal(cart.cartTotal, coupon.discountType, parseFloat(coupon.discountValue))
    return {
        exposedCoupon: {
            message: `Congratulation! You will receive these products for just ₹${discountedTotal}`,
            applied: true,
            discountedAmount: cart.cartTotal - discountedTotal,
            values: coupon
        },
        discountedTotal: discountedTotal
    }
}