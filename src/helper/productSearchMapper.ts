import { ProductSearchItem, ProductSearchResponse } from "../types/ai.types";
import { CartItemsModelType } from "../types/database.types";
import { getStockStatus } from "./aiToCartMapper";

export const searchProductMapper = (data: ProductSearchResponse): CartItemsModelType[] => {

    const products = data.hits.map((item: ProductSearchItem): CartItemsModelType => {
        return {
            itemExternalId: item.metadata._id,
            itemDescription: item.metadata.description,
            itemDiscountedPrice: parseFloat(item.metadata.discountedPrice),
            itemImageUrl: Array.isArray(item.metadata.productImages) ? item.metadata.productImages[0]  : item.metadata.productImages,
            itemName: item.metadata.productName,
            itemOriginalPrice: parseFloat(item.metadata.price),
            itemStockStatus: getStockStatus(parseInt(item.metadata.availableQuantity, 10) || 0),
            itemWeight: item.metadata.weight,
            itemWeightUnit: item.metadata.weightUnit,
            itemQuantity: 1,
            itemRecommended: false
        };
    });

    return products;
};
