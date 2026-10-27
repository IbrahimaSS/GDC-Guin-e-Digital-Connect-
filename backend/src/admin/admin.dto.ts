import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class FiltreUtilisateursDto {
  @IsOptional()
  @IsIn(['CLIENT', 'TECHNICIEN', 'ADMIN'])
  role?: 'CLIENT' | 'TECHNICIEN' | 'ADMIN';

  @IsOptional()
  @IsIn(['ACTIF', 'SUSPENDU', 'EN_ATTENTE'])
  statut?: 'ACTIF' | 'SUSPENDU' | 'EN_ATTENTE';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class StatutCompteDto {
  @IsIn(['ACTIF', 'SUSPENDU'])
  statut: 'ACTIF' | 'SUSPENDU';
}

export class FiltreDemandesAdminDto {
  @IsOptional()
  @IsIn(['ENVOYEE', 'ACCEPTEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'])
  statut?: 'ENVOYEE' | 'ACCEPTEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

  @IsOptional()
  @IsString()
  metier?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

export class CreerSignalementDto {
  /** « technicien », « client », « demande », « avis », « autre » */
  @IsIn(['technicien', 'client', 'demande', 'avis', 'autre'])
  type: string;

  /** Identifiant de l'élément signalé */
  @IsString()
  @Length(1, 60)
  cible: string;

  @IsString()
  @Length(5, 1000)
  motif: string;
}

export class TraiterSignalementDto {
  @IsOptional()
  @IsIn(['OUVERT', 'EN_COURS', 'RESOLU'])
  statut?: 'OUVERT' | 'EN_COURS' | 'RESOLU';

  @IsOptional()
  @IsIn(['basse', 'moyenne', 'haute'])
  priorite?: 'basse' | 'moyenne' | 'haute';
}
