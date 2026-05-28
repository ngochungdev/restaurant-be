import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Controller('api/v1/reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  findAll(@Query('timezone') timezone?: string) {
    return this.reservationService.findAll(timezone);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('timezone') timezone?: string) {
    return this.reservationService.findOne(+id, timezone);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationService.update(+id, updateReservationDto);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.reservationService.accept(+id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.reservationService.reject(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationService.remove(+id);
  }
}
