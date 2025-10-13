import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UrgencyLevelService } from './urgency-level.service';
import { UrgencyLevelController } from './urgency-level.controller';

@Module({
  imports: [PrismaModule],
  providers: [UrgencyLevelService],
  controllers: [UrgencyLevelController],
  exports: [UrgencyLevelService],
})
export class UrgencyLevelModule {}
