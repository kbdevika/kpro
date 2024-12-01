/*
  Warnings:

  - A unique constraint covering the columns `[userId,key]` on the table `UserSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_key_key" ON "UserSetting"("userId", "key");
