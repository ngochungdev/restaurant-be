import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateReservationDto,
  ReservationStatus,
} from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Reservation } from './entities/reservation.entity';
import { BrevoMailService } from '../../common/mail/brevo-mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private brevoMailService: BrevoMailService,
    private configService: ConfigService,
  ) {}

  async create(createReservationDto: CreateReservationDto) {
    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      customerEmail:
        createReservationDto.customerEmail || createReservationDto.email,
      reservationDate: new Date(createReservationDto.reservationDate),
    });

    const savedReservation = await this.reservationRepository.save(reservation);
    await this.sendReservationCreatedEmails(savedReservation);

    return this.toResponse(savedReservation);
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
    const reservation = await this.findEntity(id);

    return this.toResponse(reservation, timezone);
  }

  async update(id: number, updateReservationDto: UpdateReservationDto) {
    const payload = {
      ...updateReservationDto,
      customerEmail:
        updateReservationDto.customerEmail || updateReservationDto.email,
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
    const reservation = await this.findEntity(id);

    if (reservation.status === ReservationStatus.CONFIRMED) {
      return this.toResponse(reservation);
    }

    reservation.status = ReservationStatus.CONFIRMED;

    const savedReservation = await this.reservationRepository.save(reservation);
    await this.sendReservationAcceptedEmail(savedReservation);

    return this.toResponse(savedReservation);
  }

  async reject(id: number) {
    const reservation = await this.findEntity(id);

    if (reservation.status === ReservationStatus.CANCELLED) {
      return this.toResponse(reservation);
    }

    reservation.status = ReservationStatus.CANCELLED;

    const savedReservation = await this.reservationRepository.save(reservation);
    await this.sendReservationRejectedEmail(savedReservation);

    return this.toResponse(savedReservation);
  }

  private async findEntity(id: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    return reservation;
  }

  private toResponse(reservation: Reservation, timezone?: string) {
    return {
      ...reservation,
      reservationDateLocal: this.formatInTimeZone(
        reservation.reservationDate,
        timezone,
      ),
    };
  }

  private async sendReservationCreatedEmails(reservation: Reservation) {
    await Promise.all([
      this.sendCustomerEmail({
        reservation,
        subject: 'Dat ban thanh cong',
        title: 'Cam on ban da dat ban',
        message:
          'Chung toi da nhan thong tin dat ban cua ban va se xac nhan trong thoi gian som nhat.',
      }),
      this.sendAdminEmail(reservation),
    ]);
  }

  private sendReservationAcceptedEmail(reservation: Reservation) {
    return this.sendCustomerEmail({
      reservation,
      subject: 'Dat ban da duoc xac nhan',
      title: 'Dat ban cua ban da duoc xac nhan',
      message: 'Cam on ban. Chung toi rat mong duoc don tiep ban.',
    });
  }

  private sendReservationRejectedEmail(reservation: Reservation) {
    return this.sendCustomerEmail({
      reservation,
      subject: 'Dat ban chua the xac nhan',
      title: 'Dat ban cua ban chua the xac nhan',
      message:
        'Rat tiec, nha hang chua the xac nhan lich dat ban nay. Vui long lien he nha hang de duoc ho tro them.',
    });
  }

  private sendCustomerEmail({
    reservation,
    subject,
    title,
    message,
  }: {
    reservation: Reservation;
    subject: string;
    title: string;
    message: string;
  }) {
    if (!reservation.customerEmail) return Promise.resolve(false);

    return this.brevoMailService.sendMail({
      to: reservation.customerEmail,
      toName: reservation.customerName,
      subject,
      htmlContent: this.buildReservationEmailHtml({
        reservation,
        title,
        message,
      }),
      textContent: this.buildReservationEmailText({
        reservation,
        title,
        message,
      }),
    });
  }

  private sendAdminEmail(reservation: Reservation) {
    const adminEmail = this.configService.get<string>(
      'RESERVATION_ADMIN_EMAIL',
    );

    if (!adminEmail) return Promise.resolve(false);

    return this.brevoMailService.sendMail({
      to: adminEmail,
      subject: `Dat ban moi #${reservation.id}`,
      htmlContent: this.buildReservationEmailHtml({
        reservation,
        title: 'Co dat ban moi',
        message: 'Khach hang vua gui thong tin dat ban moi.',
      }),
      textContent: this.buildReservationEmailText({
        reservation,
        title: 'Co dat ban moi',
        message: 'Khach hang vua gui thong tin dat ban moi.',
      }),
    });
  }

  private buildReservationEmailHtml({
    reservation,
    title,
    message,
  }: {
    reservation: Reservation;
    title: string;
    message: string;
  }) {
    const rows = [
      ['Ma dat ban', `#${reservation.id}`],
      ['Ten khach', reservation.customerName],
      ['So dien thoai', reservation.phone],
      ['Email', reservation.customerEmail || ''],
      ['So khach', String(reservation.totalGuest)],
      ['Thoi gian', this.formatInTimeZone(reservation.reservationDate) || ''],
      ['Trang thai', reservation.status],
      ['Ghi chu', reservation.note || ''],
    ];

    return `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">${this.escapeHtml(title)}</h2>
        <p style="margin: 0 0 16px;">${this.escapeHtml(message)}</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding: 8px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${this.escapeHtml(String(label))}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e5e7eb;">${this.escapeHtml(String(value))}</td>
                </tr>
              `,
            )
            .join('')}
        </table>
      </div>
    `;
  }

  private buildReservationEmailText({
    reservation,
    title,
    message,
  }: {
    reservation: Reservation;
    title: string;
    message: string;
  }) {
    return [
      title,
      message,
      `Ma dat ban: #${reservation.id}`,
      `Ten khach: ${reservation.customerName}`,
      `So dien thoai: ${reservation.phone}`,
      `Email: ${reservation.customerEmail || ''}`,
      `So khach: ${reservation.totalGuest}`,
      `Thoi gian: ${this.formatInTimeZone(reservation.reservationDate)}`,
      `Trang thai: ${reservation.status}`,
      `Ghi chu: ${reservation.note || ''}`,
    ].join('\n');
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
