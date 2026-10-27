import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Roles,
  Utilisateur,
  type UtilisateurConnecte,
} from '../common/auth.js';
import {
  CreerDemandeDto,
  DemarrerDto,
  FiltreDemandesDto,
} from './demandes.dto.js';
import { DemandesService } from './demandes.service.js';

@ApiTags('Demandes et missions')
@ApiBearerAuth()
@Controller('demandes')
export class DemandesController {
  constructor(private readonly demandes: DemandesService) {}

  @Roles('CLIENT')
  @Post()
  @ApiOperation({
    summary: 'Publie une demande (éventuellement adressée à un technicien)',
  })
  creer(@Utilisateur() u: UtilisateurConnecte, @Body() dto: CreerDemandeDto) {
    return this.demandes.creer(u, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Mes demandes (client) ou mes missions (technicien)',
  })
  miennes(
    @Utilisateur() u: UtilisateurConnecte,
    @Query() f: FiltreDemandesDto,
  ) {
    return this.demandes.miennes(u, f);
  }

  @Roles('TECHNICIEN')
  @Get('disponibles')
  @ApiOperation({
    summary: 'Demandes ouvertes dans le métier et les zones du technicien',
  })
  disponibles(@Utilisateur() u: UtilisateurConnecte) {
    return this.demandes.disponibles(u);
  }

  @Get(':id')
  detail(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.demandes.detail(id, u);
  }

  @Roles('TECHNICIEN')
  @Post(':id/accepter')
  @HttpCode(200)
  accepter(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.demandes.accepter(id, u);
  }

  @Roles('TECHNICIEN')
  @Post(':id/en-route')
  @HttpCode(200)
  enRoute(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.demandes.enRoute(id, u);
  }

  @Roles('TECHNICIEN')
  @Post(':id/demarrer')
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Démarre l'intervention avec le code (ou QR code) présenté par le client",
  })
  demarrer(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: DemarrerDto,
  ) {
    return this.demandes.demarrer(id, u, dto.code);
  }

  @Roles('TECHNICIEN')
  @Post(':id/terminer')
  @HttpCode(200)
  terminer(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.demandes.terminer(id, u);
  }

  @Roles('TECHNICIEN')
  @Post(':id/desister')
  @HttpCode(200)
  desister(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.demandes.desister(id, u);
  }

  @Roles('CLIENT', 'ADMIN')
  @Post(':id/annuler')
  @HttpCode(200)
  annuler(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.demandes.annuler(id, u);
  }
}
