import { Module } from '@nestjs/common';
import { DemandesModule } from '../demandes/demandes.module.js';
import { AdminAvisController, AvisController } from './avis.controller.js';
import { AvisService } from './avis.service.js';

@Module({
  imports: [DemandesModule],
  controllers: [AvisController, AdminAvisController],
  providers: [AvisService],
})
export class AvisModule {}
