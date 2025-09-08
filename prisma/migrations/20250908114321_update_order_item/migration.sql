/*
  Warnings:

  - You are about to drop the column `product_id` on the `orderitem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cartItemId]` on the table `orderitem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cartItemId` to the `orderitem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `orderitem_product_id_fkey`;

-- DropIndex
DROP INDEX `orderitem_product_id_idx` ON `orderitem`;

-- AlterTable
ALTER TABLE `orderitem` DROP COLUMN `product_id`,
    ADD COLUMN `cartItemId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `orderitem_cartItemId_key` ON `orderitem`(`cartItemId`);

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_cartItemId_fkey` FOREIGN KEY (`cartItemId`) REFERENCES `cartItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
