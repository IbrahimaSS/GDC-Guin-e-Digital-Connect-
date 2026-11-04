import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AdresseDto {
  /** « Domicile », « Bureau »… */
  @IsString()
  @Length(1, 40)
  label: string;

  @IsString()
  @Length(3, 200)
  texte: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

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
}

/** Préférences de notification et de visibilité. */
export class PreferencesDto {
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  actualites?: boolean;

  /** Technicien : profil visible dans la recherche. */
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class ModifierProfilDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  nom?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  photoUrl?: string;

  @IsOptional()
  @IsIn(['PARTICULIER', 'ENTREPRISE'])
  typeClient?: 'PARTICULIER' | 'ENTREPRISE';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entreprise?: string;
}
