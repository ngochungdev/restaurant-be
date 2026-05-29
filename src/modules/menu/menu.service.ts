import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

import { Menu } from './entities/menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
  ) {}

  create(createMenuDto: CreateMenuDto) {
    if (!createMenuDto) {
      throw new BadRequestException('Request body is missing');
    }

    const menuEntity = this.menuRepository.create(
      createMenuDto as Partial<Menu>,
    );

    return this.menuRepository.save(menuEntity);
  }

  findAll() {
    return this.menuRepository.find();
  }

  findOne(id: number) {
    return this.menuRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    await this.menuRepository.update(id, updateMenuDto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.menuRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`Menu #${id} not found`);
    }

    return { deleted: true };
  }
}
