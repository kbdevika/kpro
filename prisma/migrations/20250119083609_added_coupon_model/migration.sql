-- AlterTable
ALTER TABLE "CartModel" ADD COLUMN     "couponId" TEXT;

-- CreateTable
CREATE TABLE "CouponCodeModel" (
    "id" TEXT NOT NULL,
    "couponCode" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "minimumOrderValue" TEXT NOT NULL,
    "usageLimit" INTEGER NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CouponCodeModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CouponCodeModel_couponCode_key" ON "CouponCodeModel"("couponCode");

-- AddForeignKey
ALTER TABLE "CartModel" ADD CONSTRAINT "CartModel_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "CouponCodeModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
