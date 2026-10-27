import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../common/auth.js';
import { ParametresService } from './parametres.service.js';

@ApiTags('Paramètres')
@Controller()
export class ParametresController {
  constructor(private readonly parametres: ParametresService) {}

  @Public()
  @Get('parametres')
  publics() {
    return this.parametres.tous(true);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get('admin/parametres')
  tous() {
    return this.parametres.tous();
  }

  /** Corps : { commission?: number, logoUrl?: string, … } — validé clé par clé dans le service. */
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Put('admin/parametres')
  modifier(@Body() valeurs: Record<string, unknown>) {
    return this.parametres.modifier(valeurs);
  }
}
