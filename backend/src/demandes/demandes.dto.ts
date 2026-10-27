import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreerDemandeDto {
  @IsString()
  metierId: string;

  @IsString()
  @Length(3, 120)
  titre: string;

  @IsString()
  @Length(10, 2000)
  description: string;

  @IsString()
  zoneId: string;

  @IsString()
  @Length(3, 200)
  adresse: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsOptional()
  @IsBoolean()
  urgente?: boolean;

  @IsOptional()
  @IsDateString()
  dateSouhaitee?: string;

  /** « Matin », « Après-midi », « Soir »… */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  creneau?: string;

  /** Budget indicatif en GNF */
  @IsOptional()
  @IsInt()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsUrl({ require_tld: false }, { each: true })
  photos?: string[];

  /** Demande adressée directement à un technicien choisi sur son profil. */
  @IsOptional()
  @IsString()
  technicienId?: string;
}

export class FiltreDemandesDto {
  @IsOptional()
  @IsIn(['ENVOYEE', 'ACCEPTEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'])
  statut?: 'ENVOYEE' | 'ACCEPTEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class DemarrerDto {
  /** Code à 4 chiffres présenté par le client, ou contenu du QR code « GDC-MISSION:<numero>:<code> ». */
  @IsString()
  @Length(4, 80)
  code: string;
}

export class AnnulerDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motif?: string;
}
