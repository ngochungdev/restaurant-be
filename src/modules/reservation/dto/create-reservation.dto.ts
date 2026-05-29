import { Type } from 'class-transformer';
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

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsEmail()
  @IsOptional()
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

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus = ReservationStatus.PENDING;
}
