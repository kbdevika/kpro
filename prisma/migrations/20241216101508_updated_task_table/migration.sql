/*
  Warnings:

  - You are about to drop the column `summary` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `LineItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cartId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LineItem" DROP CONSTRAINT "LineItem_taskId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "summary",
ADD COLUMN     "cartId" TEXT NOT NULL,
ADD COLUMN     "taskId" TEXT NOT NULL;

-- DropTable
DROP TABLE "LineItem";
