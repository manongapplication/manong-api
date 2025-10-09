import { TwilioController } from './twilio.controller';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('TwilioController', () => {
  let controller: TwilioController;

  beforeEach(async () => {
    const module = await createTestingModule([TwilioController]);
    controller = module.get<TwilioController>(TwilioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
