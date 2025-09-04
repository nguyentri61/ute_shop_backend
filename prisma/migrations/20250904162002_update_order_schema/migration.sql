/*
  Warnings:

  - You are about to drop the column `orderId` on the `orderitem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `orderitem` table. All the data in the column will be lost.
  - Added the required column `order_id` to the `orderitem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `orderitem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `orderitem_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `orderitem_productId_fkey`;

-- DropIndex
DROP INDEX `orderitem_orderId_idx` ON `orderitem`;

-- DropIndex
DROP INDEX `orderitem_productId_idx` ON `orderitem`;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `orderitem` DROP COLUMN `orderId`,
    DROP COLUMN `productId`,
    ADD COLUMN `order_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `product_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `orderitem_order_id_idx` ON `orderitem`(`order_id`);

-- CreateIndex
CREATE INDEX `orderitem_product_id_idx` ON `orderitem`(`product_id`);

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
