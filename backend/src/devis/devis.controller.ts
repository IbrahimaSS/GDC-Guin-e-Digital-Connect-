import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Roles,
  Utilisateur,
  type UtilisateurConnecte,
} from '../common/auth.js';
import { PaiementsService } from '../paiements/paiements.service.js';
import { EnregistrerDevisDto, PayerDto } from './devis.dto.js';
import { DevisService } from './devis.service.js';

@ApiTags('Devis et paiement')
@ApiBearerAuth()
@Controller('demandes/:id')
export class DevisController {
  constructor(
    private readonly devis: DevisService,
    private readonly paiements: PaiementsService,
  ) {}

  @Get('devis')
  consulter(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.devis.consulter(id, u);
  }

  @Roles('TECHNICIEN')
  @Put('devis')
  @ApiOperation({ summary: 'Enregistre le brouillon du devis' })
  enregistrer(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: EnregistrerDevisDto,
  ) {
    return this.devis.enregistrer(id, u, dto);
  }

  @Roles('TECHNICIEN')
  @Post('devis/envoyer')
  @HttpCode(200)
  envoyer(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.devis.envoyer(id, u);
  }

  @Roles('CLIENT')
  @Post('devis/accepter')
  @HttpCode(200)
  accepter(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.devis.accepter(id, u);
  }

  @Roles('CLIENT')
  @Post('devis/refuser')
  @HttpCode(200)
  refuser(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.devis.refuser(id, u);
  }

  @Roles('CLIENT')
  @Post('paiement')
  @ApiOperation({
    summary: 'Paie le devis accepté (Orange Money, MTN MoMo ou espèces)',
  })
  payer(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: PayerDto,
  ) {
    return this.paiements.payer(id, u, dto);
  }

  @Roles('TECHNICIEN')
  @Post('paiement/confirmer')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Le technicien confirme un paiement reçu en espèces',
  })
  confirmerEspeces(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
  ) {
    return this.paiements.confirmerEspeces(id, u);
  }
}

@ApiTags('Devis et paiement')
@ApiBearerAuth()
@Controller('paiements')
export class PaiementsController {
  constructor(private readonly paiements: PaiementsService) {}

  @Get()
  historique(@Utilisateur() u: UtilisateurConnecte) {
    return this.paiements.historique(u);
  }
}
