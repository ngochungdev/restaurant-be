import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AboutUsService } from './about-us.service';
import { AboutUs } from './entities/about-us.entity';

describe('AboutUsService', () => {
  let service: AboutUsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AboutUsService,
        {
          provide: getRepositoryToken(AboutUs),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AboutUsService>(AboutUsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
