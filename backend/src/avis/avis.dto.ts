import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CriteresDto {
  @IsInt()
  @Min(1)
  @Max(5)
  ponctualite: number;

  @IsInt()
  @Min(1)
  @Max(5)
  qualite: number;

  @IsInt()
  @Min(1)
  @Max(5)
  communication: number;

  @IsInt()
  @Min(1)
  @Max(5)
  prix: number;
}

export class CreerAvisDto {
  @IsInt()
  @Min(1)
  @Max(5)
  note: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CriteresDto)
  criteres?: CriteresDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  commentaire?: string;

  @IsOptional()
  @IsBoolean()
  recommande?: boolean;
}

export class ReponseAvisDto {
  @IsString()
  @Length(2, 1000)
  reponse: string;
}

export class SignalerDto {
  @IsString()
  @Length(5, 500)
  motif: string;
}

export class ModererAvisDto {
  @IsIn(['PUBLIE', 'MASQUE'])
  statut: 'PUBLIE' | 'MASQUE';
}

export class FiltreAvisDto {
  @IsOptional()
  @IsIn(['PUBLIE', 'EN_ATTENTE', 'MASQUE'])
  statut?: 'PUBLIE' | 'EN_ATTENTE' | 'MASQUE';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
