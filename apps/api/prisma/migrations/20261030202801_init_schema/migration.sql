-- CreateTable
CREATE TABLE `Professor` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `anonymizedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Professor_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshToken` (
    `id` VARCHAR(191) NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RefreshToken_tokenHash_key`(`tokenHash`),
    INDEX `RefreshToken_professorId_idx`(`professorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Turma` (
    `id` VARCHAR(191) NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `disciplina` VARCHAR(191) NOT NULL,
    `ano` VARCHAR(191) NOT NULL,
    `turno` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Turma_professorId_idx`(`professorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Aluno` (
    `id` VARCHAR(191) NOT NULL,
    `turmaId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `matricula` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Aluno_turmaId_matricula_key`(`turmaId`, `matricula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Questao` (
    `id` VARCHAR(191) NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `enunciado` TEXT NOT NULL,
    `tipo` VARCHAR(12) NOT NULL,
    `respostaEsperada` TEXT NULL,
    `pontuacaoMaxima` DOUBLE NULL,
    `disciplina` VARCHAR(191) NOT NULL,
    `tags` JSON NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `criadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Questao_professorId_idx`(`professorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alternativa` (
    `id` VARCHAR(191) NOT NULL,
    `questaoId` VARCHAR(191) NOT NULL,
    `letra` CHAR(1) NOT NULL,
    `texto` TEXT NOT NULL,
    `correta` BOOLEAN NOT NULL,

    UNIQUE INDEX `Alternativa_questaoId_letra_key`(`questaoId`, `letra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Prova` (
    `id` VARCHAR(191) NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `disciplina` VARCHAR(191) NOT NULL,
    `totalPontos` DOUBLE NOT NULL,
    `criadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `Prova_professorId_idx`(`professorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProvaQuestao` (
    `id` VARCHAR(191) NOT NULL,
    `provaId` VARCHAR(191) NOT NULL,
    `questaoId` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `pontuacao` DOUBLE NOT NULL,

    UNIQUE INDEX `ProvaQuestao_provaId_questaoId_key`(`provaId`, `questaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Aplicacao` (
    `id` VARCHAR(191) NOT NULL,
    `provaId` VARCHAR(191) NOT NULL,
    `turmaId` VARCHAR(191) NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `data` DATE NOT NULL,
    `versoes` INTEGER NOT NULL,
    `embaralharQuestoes` BOOLEAN NOT NULL,
    `embaralharAlternativas` BOOLEAN NOT NULL,
    `identificarAluno` BOOLEAN NOT NULL,
    `status` VARCHAR(12) NOT NULL DEFAULT 'rascunho',
    `corrigidas` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Aplicacao_professorId_idx`(`professorId`),
    INDEX `Aplicacao_turmaId_idx`(`turmaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersaoProva` (
    `id` VARCHAR(191) NOT NULL,
    `aplicacaoId` VARCHAR(191) NOT NULL,
    `numeroVersao` INTEGER NOT NULL,
    `layout` JSON NOT NULL,
    `qrCodePayload` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VersaoProva_qrCodePayload_key`(`qrCodePayload`),
    UNIQUE INDEX `VersaoProva_aplicacaoId_numeroVersao_key`(`aplicacaoId`, `numeroVersao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Correcao` (
    `id` VARCHAR(191) NOT NULL,
    `aplicacaoId` VARCHAR(191) NOT NULL,
    `alunoId` VARCHAR(191) NULL,
    `versao` INTEGER NOT NULL,
    `nota` DOUBLE NOT NULL,
    `respostas` JSON NOT NULL,
    `origem` VARCHAR(10) NOT NULL,
    `clientCorrectionId` VARCHAR(191) NOT NULL,
    `statusSync` VARCHAR(12) NOT NULL DEFAULT 'sincronizada',
    `corrigidaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Correcao_clientCorrectionId_key`(`clientCorrectionId`),
    INDEX `Correcao_aplicacaoId_idx`(`aplicacaoId`),
    INDEX `Correcao_alunoId_idx`(`alunoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RefreshToken` ADD CONSTRAINT `RefreshToken_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `Professor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Turma` ADD CONSTRAINT `Turma_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `Professor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aluno` ADD CONSTRAINT `Aluno_turmaId_fkey` FOREIGN KEY (`turmaId`) REFERENCES `Turma`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Questao` ADD CONSTRAINT `Questao_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `Professor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alternativa` ADD CONSTRAINT `Alternativa_questaoId_fkey` FOREIGN KEY (`questaoId`) REFERENCES `Questao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prova` ADD CONSTRAINT `Prova_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `Professor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProvaQuestao` ADD CONSTRAINT `ProvaQuestao_provaId_fkey` FOREIGN KEY (`provaId`) REFERENCES `Prova`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProvaQuestao` ADD CONSTRAINT `ProvaQuestao_questaoId_fkey` FOREIGN KEY (`questaoId`) REFERENCES `Questao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aplicacao` ADD CONSTRAINT `Aplicacao_provaId_fkey` FOREIGN KEY (`provaId`) REFERENCES `Prova`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aplicacao` ADD CONSTRAINT `Aplicacao_turmaId_fkey` FOREIGN KEY (`turmaId`) REFERENCES `Turma`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Aplicacao` ADD CONSTRAINT `Aplicacao_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `Professor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersaoProva` ADD CONSTRAINT `VersaoProva_aplicacaoId_fkey` FOREIGN KEY (`aplicacaoId`) REFERENCES `Aplicacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Correcao` ADD CONSTRAINT `Correcao_aplicacaoId_fkey` FOREIGN KEY (`aplicacaoId`) REFERENCES `Aplicacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Correcao` ADD CONSTRAINT `Correcao_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `Aluno`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
