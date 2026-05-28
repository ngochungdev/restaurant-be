import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('about_us')
export class AboutUs {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  image!: string;
}
