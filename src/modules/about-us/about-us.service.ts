import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAboutUsDto } from './dto/create-about-us.dto';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';
import { AboutUs } from './entities/about-us.entity';

@Injectable()
export class AboutUsService {
  constructor(
    @InjectRepository(AboutUs)
    private readonly aboutUsRepository: Repository<AboutUs>,
  ) {}

  async create(createAboutUsDto: CreateAboutUsDto) {
    const aboutUs = this.aboutUsRepository.create(createAboutUsDto);

    return this.aboutUsRepository.save(aboutUs);
  }

  findAll() {
    return this.aboutUsRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findCurrent() {
    const [aboutUs] = await this.aboutUsRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    return aboutUs || null;
  }

  async findOne(id: number) {
    const aboutUs = await this.aboutUsRepository.findOne({
      where: { id },
    });

    if (!aboutUs) {
      throw new NotFoundException(`About us #${id} not found`);
    }

    return aboutUs;
  }

  async update(id: number, updateAboutUsDto: UpdateAboutUsDto) {
    await this.aboutUsRepository.update(id, updateAboutUsDto);

    return this.findOne(id);
  }

  async upsertCurrent(updateAboutUsDto: UpdateAboutUsDto) {
    const current = await this.findCurrent();

    if (!current) {
      return this.create({
        title: updateAboutUsDto.title || 'Passion for Great Food',
        description:
          updateAboutUsDto.description ||
          'We bring fresh ingredients, warm service, and memorable dining moments to every table.',
        image: updateAboutUsDto.image,
      });
    }

    await this.aboutUsRepository.update(current.id, updateAboutUsDto);

    return this.findOne(current.id);
  }

  async remove(id: number) {
    const result = await this.aboutUsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`About us #${id} not found`);
    }

    return { deleted: true };
  }
}
