import { Module } from '@nestjs/common';
import { TechniciensController } from './techniciens.controller.js';
import { TechniciensService } from './techniciens.service.js';

@Module({
  controllers: [TechniciensController],
  providers: [TechniciensService],
  exports: [TechniciensService],
})
export class TechniciensModule {}
