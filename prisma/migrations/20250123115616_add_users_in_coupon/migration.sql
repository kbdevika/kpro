-- AlterTable
ALTER TABLE "CouponCodeModel" ADD COLUMN     "users" TEXT[] DEFAULT ARRAY[]::TEXT[];
