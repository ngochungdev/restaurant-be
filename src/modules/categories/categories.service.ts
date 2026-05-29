import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    if (!createCategoryDto) {
      throw new BadRequestException('Request body is missing');
    }

    const category = this.categoryRepository.create(createCategoryDto);

    return this.categoryRepository.save(category);
  }

  findAll() {
    return this.categoryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    await this.categoryRepository.update(id, updateCategoryDto);

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.categoryRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return { deleted: true };
  }
}
