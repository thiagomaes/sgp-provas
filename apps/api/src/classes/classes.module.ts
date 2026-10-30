import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller.js';
import { ClassesRepository } from './classes.repository.js';
import { ClassesService } from './classes.service.js';

@Module({
  controllers: [ClassesController],
  providers: [ClassesService, ClassesRepository],
})
export class ClassesModule {}
