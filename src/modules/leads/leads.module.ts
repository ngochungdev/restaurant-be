import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrevoMailService } from '../../common/mail/brevo-mail.service';
import { Lead } from './entities/lead.entity';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Lead])],
  controllers: [LeadsController],
  providers: [LeadsService, BrevoMailService],
})
export class LeadsModule {}
