import { Module } from '@nestjs/common';
import { DemandesModule } from '../demandes/demandes.module.js';
import { AdminController, SignalementsController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { StatistiquesService } from './statistiques.service.js';

@Module({
  imports: [DemandesModule],
  controllers: [AdminController, SignalementsController],
  providers: [AdminService, StatistiquesService],
})
export class AdminModule {}
