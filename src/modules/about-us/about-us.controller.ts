import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AboutUsService } from './about-us.service';
import { CreateAboutUsDto } from './dto/create-about-us.dto';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/about-us')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAboutUsDto: CreateAboutUsDto) {
    return this.aboutUsService.create(createAboutUsDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.aboutUsService.findAll();
  }

  @Get('current')
  findCurrent() {
    return this.aboutUsService.findCurrent();
  }

  @Patch('current')
  @UseGuards(JwtAuthGuard)
  upsertCurrent(@Body() updateAboutUsDto: UpdateAboutUsDto) {
    return this.aboutUsService.upsertCurrent(updateAboutUsDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.aboutUsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAboutUsDto: UpdateAboutUsDto,
  ) {
    return this.aboutUsService.update(id, updateAboutUsDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.aboutUsService.remove(id);
  }
}
