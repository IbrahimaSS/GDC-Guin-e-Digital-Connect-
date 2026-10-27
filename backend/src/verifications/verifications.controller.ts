import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
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
  DeciderVerificationDto,
  DemanderVerificationDto,
  FiltreVerificationsDto,
} from './verifications.dto.js';
import { VerificationsService } from './verifications.service.js';

@ApiTags('Vérifications')
@ApiBearerAuth()
@Roles('TECHNICIEN')
@Controller('verifications')
export class VerificationsController {
  constructor(private readonly verifications: VerificationsService) {}

  @Post()
  demander(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: DemanderVerificationDto,
  ) {
    return this.verifications.demander(u, dto);
  }

  @Get()
  miennes(@Utilisateur() u: UtilisateurConnecte) {
    return this.verifications.miennes(u);
  }
}

@ApiTags('Back-office · Vérifications')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/verifications')
export class AdminVerificationsController {
  constructor(private readonly verifications: VerificationsService) {}

  @Get()
  liste(@Query() f: FiltreVerificationsDto) {
    return this.verifications.liste(f.statut);
  }

  @Post(':id/prendre')
  @HttpCode(204)
  prendre(@Param('id') id: string) {
    return this.verifications.prendre(id);
  }

  @Post(':id/decision')
  @HttpCode(200)
  decider(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: DeciderVerificationDto,
  ) {
    return this.verifications.decider(id, u, dto);
  }
}
