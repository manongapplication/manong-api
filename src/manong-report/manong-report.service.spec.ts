import { createTestingModule } from 'test/utils/create-testing-module';
import { ManongReportService } from './manong-report.service';

describe('ManongReportService', () => {
  let service: ManongReportService;

  beforeEach(async () => {
    const module = await createTestingModule([ManongReportService]);
    service = module.get<ManongReportService>(ManongReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
