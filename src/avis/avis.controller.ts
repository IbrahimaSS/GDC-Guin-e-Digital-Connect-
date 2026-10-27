import {
  Body,
  Controller,
  Get,
  HttpCode,
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
  CreerAvisDto,
  FiltreAvisDto,
  ModererAvisDto,
  ReponseAvisDto,
  SignalerDto,
} from './avis.dto.js';
import { AvisService } from './avis.service.js';

@ApiTags('Avis')
@ApiBearerAuth()
@Controller()
export class AvisController {
  constructor(private readonly avis: AvisService) {}

  @Roles('CLIENT')
  @Post('demandes/:id/avis')
  creer(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: CreerAvisDto,
  ) {
    return this.avis.creer(id, u, dto);
  }

  @Roles('TECHNICIEN')
  @Get('avis/recus')
  recus(@Utilisateur() u: UtilisateurConnecte) {
    return this.avis.recus(u);
  }

  @Roles('TECHNICIEN')
  @Post('avis/:id/reponse')
  @HttpCode(200)
  repondre(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: ReponseAvisDto,
  ) {
    return this.avis.repondre(id, u, dto.reponse);
  }

  @Roles('TECHNICIEN')
  @Post('avis/:id/signaler')
  @HttpCode(204)
  signaler(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: SignalerDto,
  ) {
    return this.avis.signaler(id, u, dto.motif);
  }
}

@ApiTags('Back-office · Avis')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/avis')
export class AdminAvisController {
  constructor(private readonly avis: AvisService) {}

  @Get()
  liste(@Query() f: FiltreAvisDto) {
    return this.avis.liste(f);
  }

  @Patch(':id')
  moderer(@Param('id') id: string, @Body() dto: ModererAvisDto) {
    return this.avis.moderer(id, dto.statut);
  }
}
