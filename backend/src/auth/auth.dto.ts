import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class DemanderCodeDto {
  /** Numéro mobile guinéen, ex. « 620 12 34 56 » */
  @IsString()
  @MaxLength(20)
  telephone: string;
}

export class VerifierCodeDto extends DemanderCodeDto {
  @Matches(/^\d{6}$/, { message: 'Le code contient 6 chiffres.' })
  code: string;
}

export class ProfilTechnicienInscriptionDto {
  @IsString()
  metierId: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  specialites?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  experience?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  zones?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}

export class InscriptionDto {
  /** Jeton reçu à la vérification du code quand le numéro n'a pas encore de compte. */
  @IsString()
  jetonInscription: string;

  @IsString()
  @Length(1, 60)
  nom: string;

  @IsString()
  @Length(1, 60)
  prenom: string;

  @IsIn(['CLIENT', 'TECHNICIEN'])
  role: 'CLIENT' | 'TECHNICIEN';

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['PARTICULIER', 'ENTREPRISE'])
  typeClient?: 'PARTICULIER' | 'ENTREPRISE';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entreprise?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfilTechnicienInscriptionDto)
  technicien?: ProfilTechnicienInscriptionDto;
}

export class RafraichirDto {
  @IsString()
  @MinLength(20)
  rafraichissement: string;
}

export class GoogleDto {
  /** Jeton d'identité (credential) renvoyé par Google Identity Services. */
  @IsString()
  @MinLength(20)
  jeton: string;
}
