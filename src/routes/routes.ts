/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HomeController } from './../controllers/home.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CartController } from './../controllers/cart.controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "CartItemsModelType": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"itemExternalId":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"itemRecommended":{"dataType":"boolean","required":true},"itemWeightUnit":{"dataType":"string","required":true},"itemWeight":{"dataType":"double","required":true},"itemStockStatus":{"dataType":"string","required":true},"itemDiscountedPrice":{"dataType":"double","required":true},"itemOriginalPrice":{"dataType":"double","required":true},"itemQuantity":{"dataType":"double","required":true},"itemImageUrl":{"dataType":"string","required":true},"itemDescription":{"dataType":"string","required":true},"itemName":{"dataType":"string","required":true},"id":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CartModelType": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"userId":{"dataType":"string","required":true},"cartNote":{"dataType":"string","required":true},"cartSavingsMessage":{"dataType":"string","required":true},"cartSaved":{"dataType":"double","required":true},"cartDiscount":{"dataType":"double","required":true},"cartDeliveryCharges":{"dataType":"double","required":true},"cartFreeDeliveryThreshold":{"dataType":"double","required":true},"cartDeliverytime":{"dataType":"double","required":true},"cartTotal":{"dataType":"double","required":true},"cartSubTotal":{"dataType":"double","required":true},"cartItems":{"dataType":"array","array":{"dataType":"refAlias","ref":"CartItemsModelType"}},"cartStoreContact":{"dataType":"string","required":true},"cartStorePhone":{"dataType":"string","required":true},"cartStoreName":{"dataType":"string","required":true},"cartStoreId":{"dataType":"string","required":true},"id":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OndcStoreAddress": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"contactPersonMobile":{"dataType":"string","required":true},"contactPersonName":{"dataType":"string","required":true},"longitude":{"dataType":"double","required":true},"latitude":{"dataType":"double","required":true},"country":{"dataType":"string","required":true},"city":{"dataType":"string","required":true},"state":{"dataType":"string","required":true},"nearBy":{"dataType":"string","required":true},"address2":{"dataType":"string","required":true},"address1":{"dataType":"string","required":true},"pincode":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OndcStatutoryReqsPackagedCommodities": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"net_quantity_or_measure_of_commodity_in_pkg":{"dataType":"string","required":true},"month_year_of_manufacture_packing_import":{"dataType":"string","required":true},"common_or_generic_name_of_commodity":{"dataType":"string","required":true},"imported_product_country_of_origin":{"dataType":"string","required":true},"manufacturer_or_packer_address":{"dataType":"string","required":true},"manufacturer_or_packer_name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OndcCatalogue": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"statutory_reqs_packaged_commodities":{"ref":"OndcStatutoryReqsPackagedCommodities","required":true},"petpoojaVariationId":{"dataType":"string","required":true},"petpoojaAddonitemId":{"dataType":"string","required":true},"childCustomGroupId":{"dataType":"array","array":{"dataType":"string"},"required":true},"availableQuantity":{"dataType":"string","required":true},"mainRestaurantId":{"dataType":"string","required":true},"discountedPrice":{"dataType":"string","required":true},"countryOfOrigin":{"dataType":"string","required":true},"petpoojaItemId":{"dataType":"string","required":true},"subCategoryId":{"dataType":"string","required":true},"productImages":{"dataType":"array","array":{"dataType":"string"},"required":true},"packagingCost":{"dataType":"double","required":true},"isCancellable":{"dataType":"boolean","required":true},"customGroupId":{"dataType":"string","required":true},"restaurantId":{"dataType":"string","required":true},"packagedFood":{"dataType":"boolean","required":true},"isReturnable":{"dataType":"boolean","required":true},"productName":{"dataType":"string","required":true},"description":{"dataType":"string","required":true},"weightUnit":{"dataType":"string","required":true},"categoryId":{"dataType":"string","required":true},"bulkUpload":{"dataType":"boolean","required":true},"updatedAt":{"dataType":"string","required":true},"productId":{"dataType":"string","required":true},"isDeleted":{"dataType":"boolean","required":true},"createdAt":{"dataType":"string","required":true},"isCustom":{"dataType":"boolean","required":true},"weight":{"dataType":"double","required":true},"userId":{"dataType":"string","required":true},"status":{"dataType":"string","required":true},"menuId":{"dataType":"string","required":true},"price":{"dataType":"string","required":true},"brand":{"dataType":"string","required":true},"tax":{"dataType":"double","required":true},"gst":{"dataType":"double","required":true},"_id":{"dataType":"string","required":true},"__v":{"dataType":"double","required":true},"l4":{"dataType":"string","required":true},"l3":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemProduct": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"string","required":true},"storeId":{"dataType":"string","required":true},"lastUpdated":{"dataType":"string","required":true},"metadata":{"ref":"OndcCatalogue","required":true},"kikoId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MorRItems": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"product":{"ref":"ItemProduct","required":true},"matchReason":{"dataType":"string","required":true},"confidence":{"dataType":"string"},"productId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ItemsMetadata": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"recommendations":{"dataType":"array","array":{"dataType":"refAlias","ref":"MorRItems"},"required":true},"matching":{"ref":"MorRItems","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Items": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"metadata":{"ref":"ItemsMetadata","required":true},"unit":{"dataType":"string","required":true},"quantity":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OriginalItems": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"unit":{"dataType":"string","required":true},"quantity":{"dataType":"double","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Result": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"originalItems":{"dataType":"array","array":{"dataType":"refAlias","ref":"OriginalItems"},"required":true},"completeness":{"dataType":"double","required":true},"items":{"dataType":"array","array":{"dataType":"refAlias","ref":"Items"},"required":true},"storeData":{"dataType":"nestedObjectLiteral","nestedProperties":{"ondcOrderServiceability":{"dataType":"nestedObjectLiteral","nestedProperties":{"panIndiaDeliveryCharges":{"dataType":"double","required":true},"freeDeliveryMinValue":{"dataType":"double","required":true},"panIndiaDelivery":{"dataType":"boolean","required":true},"nightTimeTat":{"dataType":"string","required":true},"freeDelivery":{"dataType":"boolean","required":true},"dayTimeTat":{"dataType":"string","required":true}},"required":true},"deliveryRadius":{"dataType":"double","required":true},"storeAddress":{"ref":"OndcStoreAddress","required":true},"ondcVerified":{"dataType":"boolean","required":true},"fssaiLicense":{"dataType":"string","required":true},"storeTiming":{"dataType":"nestedObjectLiteral","nestedProperties":{"availability":{"dataType":"array","array":{"dataType":"string"},"required":true},"storeTime":{"dataType":"array","array":{"dataType":"string"},"required":true},"breakTime":{"dataType":"array","array":{"dataType":"string"},"required":true},"holidays":{"dataType":"array","array":{"dataType":"string"},"required":true}},"required":true},"storeStatus":{"dataType":"string","required":true},"storeImages":{"dataType":"array","array":{"dataType":"string"},"required":true},"description":{"dataType":"string","required":true},"storeName":{"dataType":"string","required":true},"storeLogo":{"dataType":"string","required":true},"mobile":{"dataType":"string","required":true},"phone":{"dataType":"string","required":true},"email":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"_id":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"required":true},"storeId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskResult": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"result":{"ref":"Result","required":true},"progress":{"dataType":"double","required":true},"state":{"dataType":"string","required":true},"taskId":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsHomeController_getHome: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/home',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(HomeController)),
            ...(fetchMiddlewares<RequestHandler>(HomeController.prototype.getHome)),

            async function HomeController_getHome(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHomeController_getHome, request, response });

                const controller = new HomeController();

              await templateService.apiHandler({
                methodName: 'getHome',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCartController_updateCart: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"updatedItems":{"dataType":"array","array":{"dataType":"refAlias","ref":"CartItemsModelType"},"required":true},"cartId":{"dataType":"string","required":true}}},
        };
        app.put('/cart/:cartId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CartController)),
            ...(fetchMiddlewares<RequestHandler>(CartController.prototype.updateCart)),

            async function CartController_updateCart(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCartController_updateCart, request, response });

                const controller = new CartController();

              await templateService.apiHandler({
                methodName: 'updateCart',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCartController_createCart: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"total":{"dataType":"double","required":true},"combinedSubTotal":{"dataType":"double","required":true},"combinedTotalSavedAmount":{"dataType":"double","required":true},"data":{"ref":"TaskResult","required":true}}},
        };
        app.post('/cart',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CartController)),
            ...(fetchMiddlewares<RequestHandler>(CartController.prototype.createCart)),

            async function CartController_createCart(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCartController_createCart, request, response });

                const controller = new CartController();

              await templateService.apiHandler({
                methodName: 'createCart',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCartController_createCartItems: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"cartId":{"dataType":"string","required":true},"combinedCartItems":{"dataType":"array","array":{"dataType":"refAlias","ref":"CartItemsModelType"},"required":true}}},
        };
        app.post('/cart/items',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CartController)),
            ...(fetchMiddlewares<RequestHandler>(CartController.prototype.createCartItems)),

            async function CartController_createCartItems(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCartController_createCartItems, request, response });

                const controller = new CartController();

              await templateService.apiHandler({
                methodName: 'createCartItems',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCartController_getAllCarts: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/cart',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CartController)),
            ...(fetchMiddlewares<RequestHandler>(CartController.prototype.getAllCarts)),

            async function CartController_getAllCarts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCartController_getAllCarts, request, response });

                const controller = new CartController();

              await templateService.apiHandler({
                methodName: 'getAllCarts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCartController_getCartbyId: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/cart/:cartId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CartController)),
            ...(fetchMiddlewares<RequestHandler>(CartController.prototype.getCartbyId)),

            async function CartController_getCartbyId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCartController_getCartbyId, request, response });

                const controller = new CartController();

              await templateService.apiHandler({
                methodName: 'getCartbyId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCartController_deleteCartbyId: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.delete('/cart/:cartId',
            authenticateMiddleware([{"jwt":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CartController)),
            ...(fetchMiddlewares<RequestHandler>(CartController.prototype.deleteCartbyId)),

            async function CartController_deleteCartbyId(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCartController_deleteCartbyId, request, response });

                const controller = new CartController();

              await templateService.apiHandler({
                methodName: 'deleteCartbyId',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
