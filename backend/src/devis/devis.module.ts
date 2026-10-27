import { Module } from '@nestjs/common';
import { DemandesModule } from '../demandes/demandes.module.js';
import { PaiementsService } from '../paiements/paiements.service.js';
import { DevisController, PaiementsController } from './devis.controller.js';
import { DevisService } from './devis.service.js';

@Module({
  imports: [DemandesModule],
  controllers: [DevisController, PaiementsController],
  providers: [DevisService, PaiementsService],
})
export class DevisModule {}
