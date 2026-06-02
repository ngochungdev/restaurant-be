import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Settings } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
  ) {}

  async create(createSettingDto: CreateSettingDto) {
    const setting = this.settingsRepository.create(createSettingDto);

    return this.settingsRepository.save(setting);
  }

  findAll() {
    return this.settingsRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findCurrent() {
    const [setting] = await this.settingsRepository.find({
      order: {
        id: 'DESC',
      },
      take: 1,
    });

    return setting || null;
  }

  async findOne(id: number) {
    const setting = await this.settingsRepository.findOne({
      where: { id },
    });

    if (!setting) {
      throw new NotFoundException(`Setting #${id} not found`);
    }

    return setting;
  }

  async update(id: number, updateSettingDto: UpdateSettingDto) {
    await this.settingsRepository.update(id, updateSettingDto);

    return this.findOne(id);
  }

  async upsertCurrent(updateSettingDto: UpdateSettingDto) {
    const current = await this.findCurrent();

    if (!current) {
      const restaurantName =
        updateSettingDto.restaurantName || 'Bella Restaurant';

      return this.create({
        ...updateSettingDto,
        restaurantName,
      });
    }

    await this.settingsRepository.update(current.id, updateSettingDto);

    return this.findOne(current.id);
  }

  async remove(id: number) {
    const result = await this.settingsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Setting #${id} not found`);
    }

    return { deleted: true };
  }
}
