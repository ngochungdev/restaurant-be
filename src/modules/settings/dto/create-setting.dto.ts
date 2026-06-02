import { IsOptional, IsString, IsUrl } from 'class-validator';

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
  @IsUrl({ require_protocol: true })
  facebook?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  instagram?: string;

  @IsOptional()
  @IsString()
  zalo?: string;

  @IsOptional()
  @IsString()
  brandColor?: string;
}
