/*
  Warnings:

  - Added the required column `startDate` to the `CouponCodeModel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CouponCodeModel" ADD COLUMN     "maximumOrderValue" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "minimumOrderValue" DROP NOT NULL;
