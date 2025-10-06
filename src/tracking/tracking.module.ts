import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { ServiceRequestModule } from 'src/service-request/service-request.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [ServiceRequestModule, UserModule],
  providers: [TrackingGateway],
})
export class TrackingModule {}
