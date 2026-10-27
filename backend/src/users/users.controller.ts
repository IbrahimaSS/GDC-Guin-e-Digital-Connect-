import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Utilisateur, type UtilisateurConnecte } from '../common/auth.js';
import { ModifierProfilDto } from './users.dto.js';
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

  @Get('sessions')
  sessions(@Utilisateur() u: UtilisateurConnecte) {
    return this.users.sessions(u.id);
  }
}
