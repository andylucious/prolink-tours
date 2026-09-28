-- AlterTable: events / road trips with a seat limit and a date
ALTER TABLE `Tour` ADD COLUMN `kind` ENUM('TOUR', 'EVENT', 'ROAD_TRIP') NOT NULL DEFAULT 'TOUR',
    ADD COLUMN `capacity` INTEGER NULL,
    ADD COLUMN `eventDate` DATE NULL;

-- AlterTable: back-office lock-out after 3 wrong passwords
ALTER TABLE `User` ADD COLUMN `failedLogins` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lockedAt` DATETIME(3) NULL;
