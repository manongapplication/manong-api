import { Module } from '@nestjs/common';
import { FcmModule } from 'src/fcm/fcm.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ServiceRequestModule } from 'src/service-request/service-request.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PrismaModule, FcmModule, UserModule, ServiceRequestModule],
})
export class ChatModule {}
