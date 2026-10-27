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
  MaxLength,
  Min,
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
