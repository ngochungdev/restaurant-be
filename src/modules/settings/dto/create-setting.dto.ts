import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import { blankToNull } from '../../../common/transformers/blank-to-null.transformer';

export class CreateSettingDto {
  @IsString()
  restaurantName!: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsOptional()
  @IsString()
  hotline?: string;

  @IsOptional()
  @IsString()
  openingHours?: string;

  @IsOptional()
  @Transform(blankToNull)
  @IsUrl({ require_protocol: true })
  facebook?: string | null;

  @IsOptional()
  @Transform(blankToNull)
  @IsUrl({ require_protocol: true })
  instagram?: string | null;

  @IsOptional()
  @IsString()
  zalo?: string;

  @IsOptional()
  @IsString()
  brandColor?: string;
}
