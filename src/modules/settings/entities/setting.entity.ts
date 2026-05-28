import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  restaurantName!: string;

  @Column()
  logo!: string;

  @Column()
  address!: string;

  @Column()
  hotline!: string;

  @Column()
  openingHours!: string;

  @Column()
  facebook!: string;

  @Column()
  instagram!: string;
}
