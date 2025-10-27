import { Module } from '@nestjs/common';
import { ManongController } from './manong.controller';
import { ManongService } from './manong.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { ServiceRequestModule } from 'src/service-request/service-request.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, ServiceRequestModule, UserModule],
  controllers: [ManongController],
  providers: [ManongService],
  exports: [ManongService],
})
export class ManongModule {}
