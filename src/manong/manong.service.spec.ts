import { Test, TestingModule } from '@nestjs/testing';
import { ManongService } from './manong.service';

describe('ManongService', () => {
  let service: ManongService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManongService],
    }).compile();

    service = module.get<ManongService>(ManongService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
