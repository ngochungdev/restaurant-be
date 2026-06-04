import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AboutUsService } from './about-us.service';
import { AboutUsController } from './about-us.controller';
import { AboutUs } from './entities/about-us.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AboutUs])],
  controllers: [AboutUsController],
  providers: [AboutUsService],
})
export class AboutUsModule {}
