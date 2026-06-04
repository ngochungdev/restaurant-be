import { IsOptional, IsString } from 'class-validator';

export class CreateAboutUsDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  image?: string;
}
