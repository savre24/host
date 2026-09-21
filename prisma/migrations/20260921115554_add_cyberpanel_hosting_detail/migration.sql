-- CreateTable
CREATE TABLE `CyberPanelHostingDetail` (
    `id` VARCHAR(191) NOT NULL,
    `clientServiceId` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `domainName` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `packageName` VARCHAR(191) NOT NULL,
    `phpVersion` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NULL,
    `sslEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CyberPanelHostingDetail_clientServiceId_key`(`clientServiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CyberPanelHostingDetail` ADD CONSTRAINT `CyberPanelHostingDetail_clientServiceId_fkey` FOREIGN KEY (`clientServiceId`) REFERENCES `ClientService`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CyberPanelHostingDetail` ADD CONSTRAINT `CyberPanelHostingDetail_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `CyberPanelServer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

