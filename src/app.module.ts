import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuModule } from './modules/menu/menu.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { AboutUsModule } from './modules/about-us/about-us.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'postgres',

        url: config.get('DATABASE_URL'),

        autoLoadEntities: true,

        // Never synchronize schema automatically in production — it queries
        // the entire DB schema into memory on every startup (50-100 MB spike).
        synchronize: process.env.NODE_ENV !== 'production',

        // Disable SSL certificate validation for development and testing environments.
        ssl: {
          rejectUnauthorized: false,
        },

        // 2 connections is enough for light traffic; keeps pool memory ~20 MB.
        extra: {
          max: 2,
          idleTimeoutMillis: 30000,
        },
      }),
    }),

    MenuModule,

    ReservationModule,

    AboutUsModule,

    SettingsModule,

    AuthModule,

    UsersModule,

    CategoriesModule,

    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
