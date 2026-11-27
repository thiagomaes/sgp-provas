-- CreateTable
CREATE TABLE `RecuperacaoSenha` (
    `id` VARCHAR(191) NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RecuperacaoSenha_tokenHash_key`(`tokenHash`),
    INDEX `RecuperacaoSenha_professorId_idx`(`professorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecuperacaoSenha` ADD CONSTRAINT `RecuperacaoSenha_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `Professor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

