import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AboutUs } from './modules/about-us/entities/about-us.entity';
import { User as AuthUser } from './modules/auth/entities/user.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Lead } from './modules/leads/entities/lead.entity';
import { Menu } from './modules/menu/entities/menu.entity';
import { Reservation } from './modules/reservation/entities/reservation.entity';
import { Settings } from './modules/settings/entities/setting.entity';
import { User } from './modules/users/entities/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [AboutUs, AuthUser, Category, Lead, Menu, Reservation, Settings, User],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  extra: {
    max: 2,
    idleTimeoutMillis: 30000,
  },
});
