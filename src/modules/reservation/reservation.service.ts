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
import {
  DEFAULT_RESERVATION_LANGUAGE,
  getReservationLanguage,
  RESERVATION_EMAIL_FORMATS,
  ReservationLanguage,
} from './reservation-email.format';
import { ReservationSocketService } from './reservation-socket.service';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private brevoMailService: BrevoMailService,
    private configService: ConfigService,
    private reservationSocketService: ReservationSocketService,
  ) {}

  async create(createReservationDto: CreateReservationDto) {
    const { email, lang, locale, ...reservationFields } = createReservationDto;
    const reservation = this.reservationRepository.create({
      ...reservationFields,
      customerEmail: createReservationDto.customerEmail || email,
      reservationDate: new Date(createReservationDto.reservationDate),
      language: this.resolveLanguage({
        language: createReservationDto.language,
        lang,
        locale,
      }),
    });

    const savedReservation = await this.reservationRepository.save(reservation);
    await this.sendReservationCreatedEmails(savedReservation);
    const response = this.toResponse(savedReservation);
    await this.notifyReservationsChanged('created', response);

    return response;
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
    const { email, lang, locale, ...reservationFields } = updateReservationDto;
    const payload = {
      ...reservationFields,
      customerEmail: updateReservationDto.customerEmail || email,
      reservationDate: updateReservationDto.reservationDate
        ? new Date(updateReservationDto.reservationDate)
        : undefined,
      language: this.hasLanguageInput(updateReservationDto)
        ? this.resolveLanguage({
            language: updateReservationDto.language,
            lang,
            locale,
          })
        : undefined,
    };

    await this.reservationRepository.update(id, payload);

    const reservation = await this.findOne(id);
    await this.notifyReservationsChanged('updated', reservation);

    return reservation;
  }

  async remove(id: number) {
    const result = await this.reservationRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    await this.notifyReservationsChanged('deleted', { id });

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
    const response = this.toResponse(savedReservation);
    await this.notifyReservationsChanged('accepted', response);

    return response;
  }

  async reject(id: number) {
    const reservation = await this.findEntity(id);

    if (reservation.status === ReservationStatus.CANCELLED) {
      return this.toResponse(reservation);
    }

    reservation.status = ReservationStatus.CANCELLED;

    const savedReservation = await this.reservationRepository.save(reservation);
    await this.sendReservationRejectedEmail(savedReservation);
    const response = this.toResponse(savedReservation);
    await this.notifyReservationsChanged('rejected', response);

    return response;
  }

  private async notifyReservationsChanged(
    action: 'created' | 'updated' | 'accepted' | 'rejected' | 'deleted',
    reservation?: Partial<Reservation> | { id: number },
  ) {
    const reservations = await this.findAll();

    this.reservationSocketService.emitReservationsUpdated({
      action,
      reservation,
      reservations,
    });
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
    const format = this.getEmailFormat(reservation);

    await Promise.all([
      this.sendCustomerEmail({
        reservation,
        ...format.createdCustomer,
      }),
      this.sendAdminEmail(reservation),
    ]);
  }

  private sendReservationAcceptedEmail(reservation: Reservation) {
    const format = this.getEmailFormat(reservation);

    return this.sendCustomerEmail({
      reservation,
      ...format.acceptedCustomer,
    });
  }

  private sendReservationRejectedEmail(reservation: Reservation) {
    const format = this.getEmailFormat(reservation);

    return this.sendCustomerEmail({
      reservation,
      ...format.rejectedCustomer,
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

    const format = this.getEmailFormat(reservation);

    return this.brevoMailService.sendMail({
      to: adminEmail,
      subject: `${format.createdAdmin.subject} #${reservation.id}`,
      htmlContent: this.buildReservationEmailHtml({
        reservation,
        title: format.createdAdmin.title,
        message: format.createdAdmin.message,
      }),
      textContent: this.buildReservationEmailText({
        reservation,
        title: format.createdAdmin.title,
        message: format.createdAdmin.message,
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
    const format = this.getEmailFormat(reservation);
    const labels = format.labels;
    const rows = [
      [labels.reservationCode, `#${reservation.id}`],
      [labels.customerName, reservation.customerName],
      [labels.phone, reservation.phone],
      [labels.email, reservation.customerEmail || ''],
      [labels.totalGuest, String(reservation.totalGuest)],
      [
        labels.reservationTime,
        this.formatInTimeZone(reservation.reservationDate) || '',
      ],
      [labels.status, format.statuses[reservation.status]],
      [labels.note, reservation.note || ''],
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
    const format = this.getEmailFormat(reservation);
    const labels = format.labels;

    return [
      title,
      message,
      `${labels.reservationCode}: #${reservation.id}`,
      `${labels.customerName}: ${reservation.customerName}`,
      `${labels.phone}: ${reservation.phone}`,
      `${labels.email}: ${reservation.customerEmail || ''}`,
      `${labels.totalGuest}: ${reservation.totalGuest}`,
      `${labels.reservationTime}: ${this.formatInTimeZone(reservation.reservationDate)}`,
      `${labels.status}: ${format.statuses[reservation.status]}`,
      `${labels.note}: ${reservation.note || ''}`,
    ].join('\n');
  }

  private getEmailFormat(reservation: Reservation) {
    const language = this.resolveLanguage(reservation);

    return RESERVATION_EMAIL_FORMATS[language];
  }

  private resolveLanguage(input: {
    language?: string;
    lang?: string;
    locale?: string;
  }): ReservationLanguage {
    return getReservationLanguage(
      input.language ||
        input.lang ||
        input.locale ||
        DEFAULT_RESERVATION_LANGUAGE,
    );
  }

  private hasLanguageInput(input: {
    language?: string;
    lang?: string;
    locale?: string;
  }) {
    return Boolean(input.language || input.lang || input.locale);
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
