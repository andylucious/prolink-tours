-- AlterTable
ALTER TABLE `booking` ADD COLUMN `selfBooked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `permissions` JSON NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Customer_email_key` ON `Customer`(`email`);

