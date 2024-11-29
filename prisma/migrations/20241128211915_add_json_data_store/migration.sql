/*
  Warnings:

  - You are about to drop the `CatalogueDataStore` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "CatalogueDataStore";

-- CreateTable
CREATE TABLE "Catalogue" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "jsonData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Catalogue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Catalogue_pincode_key" ON "Catalogue"("pincode");
