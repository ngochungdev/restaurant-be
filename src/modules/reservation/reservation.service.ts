import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateReservationDto,
  ReservationStatus,
} from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  create(createReservationDto: CreateReservationDto) {
    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      reservationDate: new Date(createReservationDto.reservationDate),
    });

    return this.reservationRepository.save(reservation);
  }

  findAll(timezone?: string) {
    return this.reservationRepository.find().then((reservations) =>
      reservations.map((r) => ({
        ...r,
        reservationDateLocal: this.formatInTimeZone(
          r.reservationDate,
          timezone,
        ),
      })),
    );
  }

  async findOne(id: number, timezone?: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    return {
      ...reservation,
      reservationDateLocal: this.formatInTimeZone(
        reservation.reservationDate,
        timezone,
      ),
    };
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    const payload = {
      ...updateReservationDto,
      reservationDate: updateReservationDto.reservationDate
        ? new Date(updateReservationDto.reservationDate)
        : undefined,
    };

    await this.reservationRepository.update(id, payload);

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.reservationRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    return { deleted: true };
  }

  async accept(id: number) {
    const reservation = await this.findOne(id);

    if (reservation.status === ReservationStatus.CONFIRMED) return reservation;

    reservation.status = ReservationStatus.CONFIRMED;

    return this.reservationRepository.save(reservation);
  }

  async reject(id: number) {
    const reservation = await this.findOne(id);

    if (reservation.status === ReservationStatus.CANCELLED) return reservation;

    reservation.status = ReservationStatus.CANCELLED;

    return this.reservationRepository.save(reservation);
  }

  private formatInTimeZone(date: Date | string, timezone?: string) {
    if (!date) return null;

    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Use Swedish locale to get ISO-like date ordering YYYY-MM-DD and replace space with 'T'
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const local = d.toLocaleString('sv-SE', { timeZone: tz, hour12: false });
      return local.replace(' ', 'T');
    } catch (e) {
      return new Date(date).toISOString();
    }
  }
}
