import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class MetierDto {
  /** Identifiant lisible : « electricite », « plomberie »… */
  @Matches(/^[a-z0-9-]{2,40}$/, {
    message:
      "L'identifiant contient des lettres minuscules, chiffres et tirets.",
  })
  id: string;

  @IsString()
  @Length(2, 60)
  label: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  specialites?: string[];

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ModifierMetierDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  label?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  specialites?: string[];

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ZoneDto {
  @IsString()
  @Length(2, 60)
  nom: string;

  @IsString()
  @Length(2, 60)
  ville: string;

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
  actif?: boolean;
}

export class ModifierZoneDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  nom?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  ville?: string;

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
  actif?: boolean;
}
