import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Public,
  Utilisateur,
  type UtilisateurConnecte,
} from '../common/auth.js';
import {
  DemanderCodeDto,
  GoogleDto,
  InscriptionDto,
  RafraichirDto,
  VerifierCodeDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('otp/demander')
  @HttpCode(200)
  @ApiOperation({ summary: 'Envoie un code de connexion par SMS' })
  demander(@Body() dto: DemanderCodeDto) {
    return this.auth.demanderCode(dto.telephone);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('otp/verifier')
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Vérifie le code : ouvre la session, ou renvoie un jeton d'inscription pour un nouveau numéro",
  })
  verifier(
    @Body() dto: VerifierCodeDto,
    @Headers('user-agent') appareil?: string,
  ) {
    return this.auth.verifierCode(dto.telephone, dto.code, appareil);
  }

  @Public()
  @Post('inscription')
  @ApiOperation({
    summary: 'Crée le compte client ou technicien après vérification du numéro',
  })
  inscription(
    @Body() dto: InscriptionDto,
    @Headers('user-agent') appareil?: string,
  ) {
    return this.auth.inscrire(dto, appareil);
  }

  @Public()
  @Post('rafraichir')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Renouvelle les jetons (rotation du jeton de rafraîchissement)',
  })
  rafraichir(
    @Body() dto: RafraichirDto,
    @Headers('user-agent') appareil?: string,
  ) {
    return this.auth.rafraichir(dto.rafraichissement, appareil);
  }

  @Public()
  @Post('deconnexion')
  @HttpCode(204)
  deconnexion(@Body() dto: RafraichirDto) {
    return this.auth.deconnecter(dto.rafraichissement);
  }

  @ApiBearerAuth()
  @Post('deconnexion/autres')
  @HttpCode(204)
  @ApiOperation({ summary: 'Ferme les sessions des autres appareils' })
  deconnexionAutres(
    @Utilisateur() u: UtilisateurConnecte,
    @Body() dto: Partial<RafraichirDto>,
  ) {
    return this.auth.deconnecterAutres(u.id, dto.rafraichissement);
  }

  @Public()
  @Post('google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Connexion avec Google (compte déjà existant)' })
  google(@Body() dto: GoogleDto, @Headers('user-agent') appareil?: string) {
    return this.auth.connexionGoogle(dto.jeton, appareil);
  }

  @ApiBearerAuth()
  @Post('google/lier')
  @HttpCode(204)
  @ApiOperation({ summary: 'Lie un compte Google au compte connecté' })
  lierGoogle(@Utilisateur() u: UtilisateurConnecte, @Body() dto: GoogleDto) {
    return this.auth.lierGoogle(u.id, dto.jeton);
  }
}
