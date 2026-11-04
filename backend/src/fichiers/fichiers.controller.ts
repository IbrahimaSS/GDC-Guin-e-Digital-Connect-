import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Utilisateur, type UtilisateurConnecte } from '../common/auth.js';
import { FichiersService, TAILLE_MAX } from './fichiers.service.js';

@ApiTags('Fichiers')
@ApiBearerAuth()
@Controller('fichiers')
export class FichiersController {
  constructor(private readonly fichiers: FichiersService) {}

  /** Envoi d'un fichier (champ « fichier ») : photo publique ou pièce justificative privée. */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'type', enum: ['photo', 'piece'] })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { fichier: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('fichier', {
      limits: { fileSize: TAILLE_MAX.PIECE, files: 1 },
    }),
  )
  envoyer(
    @Utilisateur() u: UtilisateurConnecte,
    @Query('type') type: string,
    @UploadedFile() fichier?: Express.Multer.File,
  ) {
    if (type !== 'photo' && type !== 'piece')
      throw new BadRequestException(
        'Type de fichier : « photo » ou « piece ».',
      );
    return this.fichiers.enregistrer(
      u,
      type === 'photo' ? 'PHOTO' : 'PIECE',
      fichier,
    );
  }

  @Get('pieces/:nom')
  async piece(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('nom') nom: string,
    @Res() res: Response,
  ) {
    const { chemin, mime } = await this.fichiers.piece(nom, u);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(chemin);
  }
}
