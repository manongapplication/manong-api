import { Test, TestingModule } from '@nestjs/testing';
import { ManongController } from './manong.controller';

describe('ManongController', () => {
  let controller: ManongController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManongController],
    }).compile();

    controller = module.get<ManongController>(ManongController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
