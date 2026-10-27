import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../common/auth.js';
import {
  MetierDto,
  ModifierMetierDto,
  ModifierZoneDto,
  ZoneDto,
} from './referentiels.dto.js';
import { ReferentielsService } from './referentiels.service.js';

@ApiTags('Référentiels')
@Controller()
export class ReferentielsController {
  constructor(private readonly ref: ReferentielsService) {}

  @Public()
  @Get('metiers')
  metiers() {
    return this.ref.metiers();
  }

  @Public()
  @Get('zones')
  zones() {
    return this.ref.zones();
  }
}

@ApiTags('Back-office · Référentiels')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminReferentielsController {
  constructor(private readonly ref: ReferentielsService) {}

  @Get('metiers')
  metiers() {
    return this.ref.metiers(true);
  }

  @Post('metiers')
  creerMetier(@Body() dto: MetierDto) {
    return this.ref.creerMetier(dto);
  }

  @Patch('metiers/:id')
  modifierMetier(@Param('id') id: string, @Body() dto: ModifierMetierDto) {
    return this.ref.modifierMetier(id, dto);
  }

  @Delete('metiers/:id')
  supprimerMetier(@Param('id') id: string) {
    return this.ref.supprimerMetier(id);
  }

  @Get('zones')
  zones() {
    return this.ref.zones(true);
  }

  @Post('zones')
  creerZone(@Body() dto: ZoneDto) {
    return this.ref.creerZone(dto);
  }

  @Patch('zones/:id')
  modifierZone(@Param('id') id: string, @Body() dto: ModifierZoneDto) {
    return this.ref.modifierZone(id, dto);
  }

  @Delete('zones/:id')
  supprimerZone(@Param('id') id: string) {
    return this.ref.supprimerZone(id);
  }
}
