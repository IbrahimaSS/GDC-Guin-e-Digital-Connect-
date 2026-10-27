import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Roles,
  Utilisateur,
  type UtilisateurConnecte,
} from '../common/auth.js';
import {
  CreerSignalementDto,
  FiltreDemandesAdminDto,
  FiltreUtilisateursDto,
  StatutCompteDto,
  TraiterSignalementDto,
} from './admin.dto.js';
import { AdminService } from './admin.service.js';

@ApiTags('Back-office')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('statistiques')
  statistiques() {
    return this.admin.statistiques();
  }

  @Get('utilisateurs')
  utilisateurs(@Query() f: FiltreUtilisateursDto) {
    return this.admin.utilisateurs(f);
  }

  @Get('utilisateurs/:id')
  utilisateur(@Param('id') id: string) {
    return this.admin.utilisateur(id);
  }

  @Patch('utilisateurs/:id/statut')
  changerStatut(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: StatutCompteDto,
  ) {
    return this.admin.changerStatut(id, u, dto.statut);
  }

  @Get('demandes')
  demandes(
    @Utilisateur() u: UtilisateurConnecte,
    @Query() f: FiltreDemandesAdminDto,
  ) {
    return this.admin.listeDemandes(u, f);
  }

  @Get('signalements')
  signalements(@Query('statut') statut?: string) {
    return this.admin.signalements(statut);
  }

  @Patch('signalements/:id')
  traiterSignalement(
    @Param('id') id: string,
    @Body() dto: TraiterSignalementDto,
  ) {
    return this.admin.traiterSignalement(id, dto);
  }
}

@ApiTags('Signalements')
@ApiBearerAuth()
@Controller('signalements')
export class SignalementsController {
  constructor(private readonly admin: AdminService) {}

  @Post()
  signaler(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: CreerSignalementDto,
  ) {
    return this.admin.signaler(u, dto);
  }
}
