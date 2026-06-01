import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { BrevoMailService } from '../../common/mail/brevo-mail.service';
import { JwtModule } from '@nestjs/jwt';
import { ReservationSocketService } from './reservation-socket.service';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../auth/jwt.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES_IN },
    }),
  ],
  controllers: [ReservationController],
  providers: [ReservationService, BrevoMailService, ReservationSocketService],
  exports: [ReservationSocketService],
})
export class ReservationModule {}
