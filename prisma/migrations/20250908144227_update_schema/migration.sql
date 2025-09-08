/*
  Warnings:

  - You are about to drop the column `cartItemId` on the `orderitem` table. All the data in the column will be lost.
  - Added the required column `variantId` to the `orderitem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `orderitem_cartItemId_fkey`;

-- DropIndex
DROP INDEX `orderitem_cartItemId_key` ON `orderitem`;

-- AlterTable
ALTER TABLE `orderitem` DROP COLUMN `cartItemId`,
    ADD COLUMN `price` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `variantId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `orderitem_variantId_idx` ON `orderitem`(`variantId`);

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `productVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
