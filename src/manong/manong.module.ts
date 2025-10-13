import { Module } from '@nestjs/common';
import { ManongController } from './manong.controller';
import { ManongService } from './manong.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ServiceRequestModule } from 'src/service-request/service-request.module';

@Module({
  imports: [PrismaModule, AuthModule, ServiceRequestModule],
  controllers: [ManongController],
  providers: [ManongService],
  exports: [ManongService],
})
export class ManongModule {}
