import { AppVersionService } from './app-version.service';
import { PrismaModule } from './../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppVersionController } from './app-version.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [AuthModule, PrismaModule, UserModule],
  providers: [AppVersionService],
  controllers: [AppVersionController],
  exports: [AppVersionService],
})
export class AppVersionModule {}
