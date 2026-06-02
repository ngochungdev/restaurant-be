import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 'Bella Restaurant' })
  restaurantName!: string;

  @Column({ nullable: true })
  logo!: string;

  @Column({ nullable: true })
  heroImage!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  fullAddress!: string;

  @Column({ nullable: true })
  hotline!: string;

  @Column({ nullable: true })
  openingHours!: string;

  @Column({ nullable: true })
  facebook!: string;

  @Column({ nullable: true })
  instagram!: string;

  @Column({ nullable: true })
  zalo!: string;

  @Column({ nullable: true })
  brandColor!: string;
}
