-- CreateTable
CREATE TABLE "CatalogueDataStore" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jsonData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogueDataStore_pkey" PRIMARY KEY ("id")
);
