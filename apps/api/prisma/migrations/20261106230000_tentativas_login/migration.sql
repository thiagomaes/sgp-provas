-- CreateTable
CREATE TABLE `TentativaLogin` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `sucesso` BOOLEAN NOT NULL,
    `criadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TentativaLogin_email_criadaEm_idx`(`email`, `criadaEm`),
    INDEX `TentativaLogin_ip_criadaEm_idx`(`ip`, `criadaEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

