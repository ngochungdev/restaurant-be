import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuModule } from './modules/menu/menu.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { AboutUsModule } from './modules/about-us/about-us.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

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

        synchronize: true,
      }),
    }),

    MenuModule,

    ReservationModule,

    AboutUsModule,

    SettingsModule,

    AuthModule,

    UsersModule,
  ],
})
export class AppModule {}
