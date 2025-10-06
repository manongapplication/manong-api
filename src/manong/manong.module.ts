import { Module } from '@nestjs/common';
import { ManongController } from './manong.controller';
import { ManongService } from './manong.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ManongController],
  providers: [ManongService],
  exports: [ManongService],
})
export class ManongModule {}
