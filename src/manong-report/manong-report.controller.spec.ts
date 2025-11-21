import { ManongReportController } from './manong-report.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ManongReportController', () => {
  let controller: ManongReportController;

  beforeEach(async () => {
    const module = await createTestingModule([ManongReportController]);
    controller = module.get<ManongReportController>(ManongReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
