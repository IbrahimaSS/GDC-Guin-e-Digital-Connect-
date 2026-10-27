import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';

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
