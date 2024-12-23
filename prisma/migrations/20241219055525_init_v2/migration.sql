-- CreateTable
CREATE TABLE "CartItemsModel" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "itemImageUrl" TEXT NOT NULL,
    "itemQuantity" INTEGER NOT NULL,
    "itemOriginalPrice" DOUBLE PRECISION NOT NULL,
    "itemDiscountedPrice" DOUBLE PRECISION NOT NULL,
    "itemStockStatus" TEXT NOT NULL,
    "itemWeight" DOUBLE PRECISION NOT NULL,
    "itemWeightUnit" TEXT NOT NULL,
    "itemRecommended" BOOLEAN NOT NULL,
    "cartId" TEXT NOT NULL,

    CONSTRAINT "CartItemsModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartModel" (
    "id" TEXT NOT NULL,
    "cartStoreId" TEXT NOT NULL,
    "cartSubTotal" DOUBLE PRECISION NOT NULL,
    "cartTotal" DOUBLE PRECISION NOT NULL,
    "cartDeliverytime" DOUBLE PRECISION NOT NULL,
    "cartFreeDeliveryThreshold" DOUBLE PRECISION NOT NULL,
    "cartDeliveryCharges" DOUBLE PRECISION NOT NULL,
    "cartDiscount" DOUBLE PRECISION NOT NULL,
    "cartSaved" DOUBLE PRECISION NOT NULL,
    "cartSavingsMessage" TEXT NOT NULL,
    "cartNote" TEXT NOT NULL,

    CONSTRAINT "CartModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminModel" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "adminPassword" TEXT NOT NULL,
    "adminCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationModel" (
    "id" TEXT NOT NULL,
    "notificationMessage" TEXT NOT NULL,
    "notificationMediaUrl" TEXT NOT NULL,
    "notificationCreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "NotificationModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAddressModel" (
    "id" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT NOT NULL,
    "addressStreet" TEXT NOT NULL,
    "addressCity" TEXT NOT NULL,
    "addressState" TEXT NOT NULL,
    "addressCountry" TEXT NOT NULL,
    "addressPostalCode" INTEGER NOT NULL,
    "addressLatitude" DOUBLE PRECISION NOT NULL,
    "addressLongitude" DOUBLE PRECISION NOT NULL,
    "addressAddressType" TEXT NOT NULL,
    "addressLandmark" TEXT NOT NULL,
    "addressContactName" TEXT NOT NULL,
    "addressContactPhone" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserAddressModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettingsModel" (
    "id" TEXT NOT NULL,
    "settingsKey" TEXT NOT NULL,
    "settingsValue" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserSettingsModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModel" (
    "id" TEXT NOT NULL,
    "userArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskModel" (
    "id" TEXT NOT NULL,
    "taskStatus" TEXT NOT NULL,
    "taskExternalId" TEXT NOT NULL,
    "taskCreatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cartId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TaskModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderModel" (
    "id" TEXT NOT NULL,
    "orderStatus" TEXT NOT NULL,
    "orderDeliveryStatus" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OrderModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartItemsModel_id_idx" ON "CartItemsModel"("id");

-- CreateIndex
CREATE INDEX "CartItemsModel_itemRecommended_idx" ON "CartItemsModel"("itemRecommended");

-- CreateIndex
CREATE INDEX "CartItemsModel_itemStockStatus_idx" ON "CartItemsModel"("itemStockStatus");

-- CreateIndex
CREATE INDEX "CartModel_id_idx" ON "CartModel"("id");

-- CreateIndex
CREATE INDEX "CartModel_cartStoreId_idx" ON "CartModel"("cartStoreId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminModel_adminEmail_key" ON "AdminModel"("adminEmail");

-- CreateIndex
CREATE INDEX "AdminModel_id_idx" ON "AdminModel"("id");

-- CreateIndex
CREATE INDEX "NotificationModel_id_idx" ON "NotificationModel"("id");

-- CreateIndex
CREATE INDEX "NotificationModel_userId_idx" ON "NotificationModel"("userId");

-- CreateIndex
CREATE INDEX "UserAddressModel_id_idx" ON "UserAddressModel"("id");

-- CreateIndex
CREATE INDEX "UserAddressModel_userId_idx" ON "UserAddressModel"("userId");

-- CreateIndex
CREATE INDEX "UserAddressModel_addressPostalCode_idx" ON "UserAddressModel"("addressPostalCode");

-- CreateIndex
CREATE INDEX "UserSettingsModel_settingsKey_idx" ON "UserSettingsModel"("settingsKey");

-- CreateIndex
CREATE INDEX "UserSettingsModel_id_idx" ON "UserSettingsModel"("id");

-- CreateIndex
CREATE INDEX "UserSettingsModel_userId_idx" ON "UserSettingsModel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettingsModel_userId_settingsKey_key" ON "UserSettingsModel"("userId", "settingsKey");

-- CreateIndex
CREATE INDEX "UserModel_id_idx" ON "UserModel"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TaskModel_taskExternalId_key" ON "TaskModel"("taskExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskModel_cartId_key" ON "TaskModel"("cartId");

-- CreateIndex
CREATE INDEX "TaskModel_id_idx" ON "TaskModel"("id");

-- CreateIndex
CREATE INDEX "TaskModel_userId_idx" ON "TaskModel"("userId");

-- CreateIndex
CREATE INDEX "TaskModel_cartId_idx" ON "TaskModel"("cartId");

-- CreateIndex
CREATE INDEX "TaskModel_taskExternalId_idx" ON "TaskModel"("taskExternalId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderModel_cartId_key" ON "OrderModel"("cartId");

-- CreateIndex
CREATE INDEX "OrderModel_id_idx" ON "OrderModel"("id");

-- CreateIndex
CREATE INDEX "OrderModel_userId_idx" ON "OrderModel"("userId");

-- CreateIndex
CREATE INDEX "OrderModel_cartId_idx" ON "OrderModel"("cartId");

-- AddForeignKey
ALTER TABLE "CartItemsModel" ADD CONSTRAINT "CartItemsModel_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "CartModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationModel" ADD CONSTRAINT "NotificationModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddressModel" ADD CONSTRAINT "UserAddressModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettingsModel" ADD CONSTRAINT "UserSettingsModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskModel" ADD CONSTRAINT "TaskModel_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "CartModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskModel" ADD CONSTRAINT "TaskModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderModel" ADD CONSTRAINT "OrderModel_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "CartModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderModel" ADD CONSTRAINT "OrderModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
