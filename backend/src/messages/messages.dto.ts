import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class EnvoyerMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  texte?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  photoUrl?: string;
}
