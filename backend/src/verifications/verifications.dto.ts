import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PieceDto {
  /** « piece_identite », « diplome », « attestation », « photo_chantier »… */
  @IsString()
  @Length(2, 40)
  type: string;

  @IsUrl({ require_tld: false })
  url: string;
}

export class DemanderVerificationDto {
  @IsInt()
  @Min(1)
  @Max(3)
  niveau: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PieceDto)
  pieces: PieceDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class DeciderVerificationDto {
  @IsIn(['APPROUVEE', 'REFUSEE'])
  decision: 'APPROUVEE' | 'REFUSEE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  commentaire?: string;
}

export class FiltreVerificationsDto {
  @IsOptional()
  @IsIn(['EN_ATTENTE', 'EN_COURS', 'APPROUVEE', 'REFUSEE'])
  statut?: 'EN_ATTENTE' | 'EN_COURS' | 'APPROUVEE' | 'REFUSEE';
}
