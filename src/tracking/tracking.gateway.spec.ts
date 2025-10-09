import { TrackingGateway } from './tracking.gateway';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;

  beforeEach(async () => {
    const module = await createTestingModule([TrackingGateway]);
    gateway = module.get<TrackingGateway>(TrackingGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
