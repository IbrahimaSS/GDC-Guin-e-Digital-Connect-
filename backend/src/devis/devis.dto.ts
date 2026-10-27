import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class LigneDevisDto {
  @IsString()
  @Length(2, 120)
  libelle: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  quantite: number;

  /** Prix unitaire en GNF */
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  prix: number;
}

export class EnregistrerDevisDto {
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => LigneDevisDto)
  lignes: LigneDevisDto[];

  @IsInt()
  @Min(0)
  @Max(10_000_000)
  deplacement: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class PayerDto {
  @IsIn(['ORANGE', 'MTN', 'ESPECES'])
  moyen: 'ORANGE' | 'MTN' | 'ESPECES';

  /** Numéro du compte mobile money débité (Orange Money, MTN MoMo). */
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s+]{8,20}$/, { message: 'Numéro de téléphone invalide.' })
  numero?: string;
}
