/*
  Warnings:

  - Added the required column `cartStoreContact` to the `CartModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cartStoreName` to the `CartModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cartStorePhone` to the `CartModel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartModel" ADD COLUMN     "cartStoreContact" TEXT NOT NULL,
ADD COLUMN     "cartStoreName" TEXT NOT NULL,
ADD COLUMN     "cartStorePhone" TEXT NOT NULL;
