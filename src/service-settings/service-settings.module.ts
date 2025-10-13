import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ServiceSettingsService } from './service-settings.service';
import { ServiceSettingsController } from './service-settings.controller';

@Module({
  imports: [PrismaModule],
  providers: [ServiceSettingsService],
  controllers: [ServiceSettingsController],
  exports: [ServiceSettingsService],
})
export class ServiceSettingsModule {}
