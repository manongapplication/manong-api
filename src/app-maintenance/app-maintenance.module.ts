import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppMaintenanceService } from './app-maintenance.service';
import { AppMaintenanceController } from './app-maintenance.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule],
  providers: [AppMaintenanceService],
  controllers: [AppMaintenanceController],
  exports: [AppMaintenanceService],
})
export class AppMaintenanceModule {}
