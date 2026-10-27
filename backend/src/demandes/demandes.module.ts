import { Module } from '@nestjs/common';
import { DemandesController } from './demandes.controller.js';
import { DemandesService } from './demandes.service.js';

@Module({
  controllers: [DemandesController],
  providers: [DemandesService],
  exports: [DemandesService],
})
export class DemandesModule {}
