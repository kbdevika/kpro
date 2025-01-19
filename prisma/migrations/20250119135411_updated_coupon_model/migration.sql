/*
  Warnings:

  - Made the column `minimumOrderValue` on table `CouponCodeModel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maximumOrderValue` on table `CouponCodeModel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CouponCodeModel" ALTER COLUMN "minimumOrderValue" SET NOT NULL,
ALTER COLUMN "maximumOrderValue" SET NOT NULL;
