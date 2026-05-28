import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('decimal')
  price!: number;

  @Column()
  image!: string;

  @Column()
  category!: string;

  @Column('text')
  description!: string;

  @Column({
    default: true,
  })
  isAvailable!: boolean;
}
