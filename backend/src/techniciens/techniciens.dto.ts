import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RechercheTechniciensDto {
  @IsOptional()
  @IsString()
  metier?: string;

  /** Identifiant de zone */
  @IsOptional()
  @IsString()
  zone?: string;

  /** Recherche libre : nom, spécialité, métier */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  niveauMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  noteMin?: number;

  @IsOptional()
  // « ?disponible=false » arrive en texte : Boolean('false') vaudrait true.
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  disponible?: boolean;

  @IsOptional()
  @IsIn(['pertinence', 'note', 'avis', 'experience', 'missions'])
  tri?: 'pertinence' | 'note' | 'avis' | 'experience' | 'missions';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  parPage?: number;
}

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreneauJourDto {
  @IsIn([
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche',
  ])
  jour: string;

  @IsBoolean()
  actif: boolean;

  @Matches(HEURE)
  debut: string;

  @Matches(HEURE)
  fin: string;
}

export class CongeDto {
  @Matches(DATE)
  du: string;

  @Matches(DATE)
  au: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  motif?: string;
}

/** Calendrier du technicien. */
export class AgendaDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => CreneauJourDto)
  planning: CreneauJourDto[];

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CongeDto)
  conges: CongeDto[];

  @IsBoolean()
  urgences: boolean;

  @IsIn(['1h', '2h', '24h', '48h'])
  delai: string;
}

export class TarifDto {
  @IsString()
  @Length(2, 80)
  prestation: string;

  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  prix: number;
}

export class ModifierRealisationDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  titre?: string;

  @IsOptional()
  @IsString()
  @Length(2, 40)
  categorie?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;
}

export class ModifierProfilTechnicienDto {
  @IsOptional()
  @IsString()
  metierId?: string;

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
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  disponibilites?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  zones?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AgendaDto)
  agenda?: AgendaDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TarifDto)
  tarifs?: TarifDto[];
}

export class DisponibiliteDto {
  @IsBoolean()
  disponible: boolean;
}

export class RealisationDto {
  @IsString()
  @Length(2, 80)
  titre: string;

  @IsString()
  @Length(2, 40)
  categorie: string;

  @IsUrl({ require_tld: false })
  imageUrl: string;
}
