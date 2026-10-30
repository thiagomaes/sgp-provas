import { Module } from '@nestjs/common';
import { CorrectionsController } from './corrections.controller.js';
import { CorrectionsRepository } from './corrections.repository.js';
import { CorrectionsService } from './corrections.service.js';

@Module({
  controllers: [CorrectionsController],
  providers: [CorrectionsService, CorrectionsRepository],
})
export class CorrectionsModule {}
