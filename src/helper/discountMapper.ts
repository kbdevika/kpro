
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
