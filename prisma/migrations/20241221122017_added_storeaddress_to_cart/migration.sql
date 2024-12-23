/*
  Warnings:

  - Added the required column `cartStoreAddress` to the `CartModel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CartModel" ADD COLUMN     "cartStoreAddress" TEXT NOT NULL;
