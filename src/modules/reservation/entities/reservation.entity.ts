import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ReservationStatus } from '../dto/create-reservation.dto';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  customerName!: string;

  @Column()
  phone!: string;

  @Column('int')
  totalGuest!: number;

  @Column('timestamp')
  reservationDate!: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  note?: string;

  @Column({
    type: 'varchar',
    default: ReservationStatus.PENDING,
  })
  status!: ReservationStatus;
}
