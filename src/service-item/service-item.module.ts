import { Module } from '@nestjs/common';
import { ServiceItemService } from './service-item.service';
import { ServiceItemController } from './service-item.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceItemController],
  providers: [ServiceItemService],
  exports: [ServiceItemService],
})
export class ServiceItemModule {}
