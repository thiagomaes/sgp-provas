-- AlterTable
ALTER TABLE `VersaoProva` ADD COLUMN `alunoId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `VersaoProva_alunoId_idx` ON `VersaoProva`(`alunoId`);

-- CreateIndex
CREATE UNIQUE INDEX `VersaoProva_aplicacaoId_alunoId_key` ON `VersaoProva`(`aplicacaoId`, `alunoId`);

-- AddForeignKey
ALTER TABLE `VersaoProva` ADD CONSTRAINT `VersaoProva_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `Aluno`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
