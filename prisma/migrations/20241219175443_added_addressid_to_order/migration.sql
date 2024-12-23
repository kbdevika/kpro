/*
  Warnings:

  - Added the required column `addressId` to the `OrderModel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderModel" ADD COLUMN     "addressId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "OrderModel_addressId_idx" ON "OrderModel"("addressId");

-- AddForeignKey
ALTER TABLE "OrderModel" ADD CONSTRAINT "OrderModel_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "UserAddressModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
