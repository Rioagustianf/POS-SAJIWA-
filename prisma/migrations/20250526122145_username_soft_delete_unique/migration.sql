/*
  Warnings:

  - A unique constraint covering the columns `[username,isActive]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `User_username_key` ON `user`;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_isActive_key` ON `User`(`username`, `isActive`);
