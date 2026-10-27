import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Public,
  Roles,
  Utilisateur,
  type UtilisateurConnecte,
} from '../common/auth.js';
import {
  DisponibiliteDto,
  ModifierProfilTechnicienDto,
  RealisationDto,
  RechercheTechniciensDto,
} from './techniciens.dto.js';
import { TechniciensService } from './techniciens.service.js';

@ApiTags('Techniciens')
@Controller('techniciens')
export class TechniciensController {
  constructor(private readonly techniciens: TechniciensService) {}

  @Public()
  @Get()
  rechercher(@Query() filtres: RechercheTechniciensDto) {
    return this.techniciens.rechercher(filtres);
  }

  // Routes « moi » déclarées avant « :id » pour ne pas être capturées par le paramètre.
  @ApiBearerAuth()
  @Roles('TECHNICIEN')
  @Get('moi')
  monProfil(@Utilisateur() u: UtilisateurConnecte) {
    return this.techniciens.monProfil(u.id);
  }

  @ApiBearerAuth()
  @Roles('TECHNICIEN')
  @Patch('moi')
  modifier(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: ModifierProfilTechnicienDto,
  ) {
    return this.techniciens.modifier(u.id, dto);
  }

  @ApiBearerAuth()
  @Roles('TECHNICIEN')
  @Patch('moi/disponibilite')
  disponibilite(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: DisponibiliteDto,
  ) {
    return this.techniciens.disponibilite(u.id, dto);
  }

  @ApiBearerAuth()
  @Roles('TECHNICIEN')
  @Get('moi/statistiques')
  statistiques(@Utilisateur() u: UtilisateurConnecte) {
    return this.techniciens.statistiques(u.id);
  }

  @ApiBearerAuth()
  @Roles('TECHNICIEN')
  @Post('moi/realisations')
  ajouterRealisation(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: RealisationDto,
  ) {
    return this.techniciens.ajouterRealisation(u.id, dto);
  }

  @ApiBearerAuth()
  @Roles('TECHNICIEN')
  @Delete('moi/realisations/:id')
  @HttpCode(204)
  supprimerRealisation(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
  ) {
    return this.techniciens.supprimerRealisation(u.id, id);
  }

  @Public()
  @Get(':id')
  profil(@Param('id') id: string) {
    return this.techniciens.profil(id);
  }
}
