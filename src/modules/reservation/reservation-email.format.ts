import { ReservationStatus } from './dto/create-reservation.dto';

export type ReservationLanguage = 'vi' | 'en';

type ReservationEmailContent = {
  subject: string;
  title: string;
  message: string;
};

type ReservationEmailFormat = {
  createdCustomer: ReservationEmailContent;
  acceptedCustomer: ReservationEmailContent;
  rejectedCustomer: ReservationEmailContent;
  createdAdmin: ReservationEmailContent;
  labels: {
    reservationCode: string;
    customerName: string;
    phone: string;
    email: string;
    totalGuest: string;
    reservationTime: string;
    status: string;
    note: string;
  };
  statuses: Record<ReservationStatus, string>;
};

export const DEFAULT_RESERVATION_LANGUAGE: ReservationLanguage = 'vi';

export const RESERVATION_EMAIL_FORMATS: Record<
  ReservationLanguage,
  ReservationEmailFormat
> = {
  vi: {
    createdCustomer: {
      subject: 'Đặt bàn thành công',
      title: 'Cảm ơn bạn đã đặt bàn',
      message:
        'Chúng tôi đã nhận thông tin đặt bàn của bạn và sẽ xác nhận trong thời gian sớm nhất.',
    },
    acceptedCustomer: {
      subject: 'Đặt bàn đã được xác nhận',
      title: 'Đặt bàn của bạn đã được xác nhận',
      message: 'Cảm ơn bạn. Chúng tôi rất mong được đón tiếp bạn.',
    },
    rejectedCustomer: {
      subject: 'Đặt bàn chưa thể xác nhận',
      title: 'Đặt bàn của bạn chưa thể xác nhận',
      message:
        'Rất tiếc, nhà hàng chưa thể xác nhận lịch đặt bàn này. Vui lòng liên hệ nhà hàng để được hỗ trợ thêm.',
    },
    createdAdmin: {
      subject: 'Đặt bàn mới',
      title: 'Có đặt bàn mới',
      message: 'Khách hàng vừa gửi thông tin đặt bàn mới.',
    },
    labels: {
      reservationCode: 'Mã đặt bàn',
      customerName: 'Tên khách',
      phone: 'Số điện thoại',
      email: 'Email',
      totalGuest: 'Số khách',
      reservationTime: 'Thời gian',
      status: 'Trạng thái',
      note: 'Ghi chú',
    },
    statuses: {
      [ReservationStatus.PENDING]: 'Đang chờ',
      [ReservationStatus.CONFIRMED]: 'Đã xác nhận',
      [ReservationStatus.CANCELLED]: 'Đã hủy',
    },
  },
  en: {
    createdCustomer: {
      subject: 'Reservation received',
      title: 'Thank you for your reservation',
      message:
        'We have received your reservation details and will confirm as soon as possible.',
    },
    acceptedCustomer: {
      subject: 'Reservation confirmed',
      title: 'Your reservation has been confirmed',
      message: 'Thank you. We look forward to welcoming you.',
    },
    rejectedCustomer: {
      subject: 'Reservation cannot be confirmed',
      title: 'Your reservation cannot be confirmed',
      message:
        'Sorry, the restaurant cannot confirm this reservation. Please contact us for more support.',
    },
    createdAdmin: {
      subject: 'New reservation',
      title: 'New reservation received',
      message: 'A customer has submitted a new reservation.',
    },
    labels: {
      reservationCode: 'Reservation code',
      customerName: 'Customer name',
      phone: 'Phone',
      email: 'Email',
      totalGuest: 'Guests',
      reservationTime: 'Time',
      status: 'Status',
      note: 'Note',
    },
    statuses: {
      [ReservationStatus.PENDING]: 'Pending',
      [ReservationStatus.CONFIRMED]: 'Confirmed',
      [ReservationStatus.CANCELLED]: 'Cancelled',
    },
  },
};

export function getReservationLanguage(language?: string): ReservationLanguage {
  const normalized = language?.trim().toLowerCase().split(/[-_]/)[0];

  if (normalized === 'en') return 'en';
  if (normalized === 'vi') return 'vi';

  return DEFAULT_RESERVATION_LANGUAGE;
}
