import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  WON = 'WON',
  LOST = 'LOST',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  restaurantName!: string;

  @Column()
  contactName!: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ nullable: true })
  source?: string;

  @Column({
    type: 'varchar',
    default: LeadStatus.NEW,
  })
  status!: LeadStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
