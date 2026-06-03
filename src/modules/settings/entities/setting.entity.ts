import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 'Bella Restaurant' })
  restaurantName!: string;

  @Column({ type: 'varchar', nullable: true })
  logo!: string | null;

  @Column({ type: 'varchar', nullable: true })
  heroImage!: string | null;

  @Column({ type: 'varchar', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', nullable: true })
  fullAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  hotline!: string | null;

  @Column({ type: 'varchar', nullable: true })
  openingHours!: string | null;

  @Column({ type: 'varchar', nullable: true })
  facebook!: string | null;

  @Column({ type: 'varchar', nullable: true })
  instagram!: string | null;

  @Column({ type: 'varchar', nullable: true })
  zalo!: string | null;

  @Column({ type: 'varchar', nullable: true })
  brandColor!: string | null;
}
