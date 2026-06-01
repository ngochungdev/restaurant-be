import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsEnum,
  IsEmail,
} from 'class-validator';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsEmail()
  email?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalGuest!: number;

  @IsDateString()
  reservationDate!: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  lang?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus = ReservationStatus.PENDING;
}
