import { ChatGateway } from './chat.gateway';
import { createTestingModule } from 'test/utils/create-testing-module';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module = await createTestingModule([ChatGateway]);
    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
