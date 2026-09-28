-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `selfBooked` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `permissions` JSON NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Customer_email_key` ON `Customer`(`email`);
