/*
  Warnings:

  - Added the required column `image` to the `CartItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryStatus" TEXT NOT NULL DEFAULT 'Not-Initiated';
