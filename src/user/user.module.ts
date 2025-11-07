import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserController } from './user.controller';
import { ProviderVerificationModule } from 'src/provider-verification/provider-verification.module';
import { AuthModule } from 'src/auth/auth.module';
import { FcmModule } from 'src/fcm/fcm.module';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { AppMaintenanceService } from 'src/app-maintenance/app-maintenance.service';

@Module({
  imports: [
    PrismaModule,
    ProviderVerificationModule,
    forwardRef(() => AuthModule),
    FcmModule,
  ],
  providers: [UserService, AppMaintenanceGuard, AppMaintenanceService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
