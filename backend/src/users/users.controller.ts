import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Utilisateur, type UtilisateurConnecte } from '../common/auth.js';
import { AdresseDto, ModifierProfilDto, PreferencesDto } from './users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Mon compte')
@ApiBearerAuth()
@Controller('moi')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  moi(@Utilisateur() u: UtilisateurConnecte) {
    return this.users.moi(u.id);
  }

  @Patch()
  modifier(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: ModifierProfilDto,
  ) {
    return this.users.modifier(u.id, dto);
  }

  @Delete()
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Supprime le compte (données personnelles effacées, historique anonymisé)',
  })
  supprimer(@Utilisateur() u: UtilisateurConnecte) {
    return this.users.supprimerCompte(u.id);
  }

  @Get('sessions')
  sessions(@Utilisateur() u: UtilisateurConnecte) {
    return this.users.sessions(u.id);
  }

  @Get('adresses')
  adresses(@Utilisateur() u: UtilisateurConnecte) {
    return this.users.adresses(u.id);
  }

  @Post('adresses')
  ajouterAdresse(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: AdresseDto,
  ) {
    return this.users.ajouterAdresse(u.id, dto);
  }

  @Delete('adresses/:id')
  @HttpCode(204)
  supprimerAdresse(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
  ) {
    return this.users.supprimerAdresse(u.id, id);
  }

  @Get('preferences')
  preferences(@Utilisateur() u: UtilisateurConnecte) {
    return this.users.preferences(u.id);
  }

  @Put('preferences')
  modifierPreferences(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: PreferencesDto,
  ) {
    return this.users.modifierPreferences(u.id, dto);
  }
}
