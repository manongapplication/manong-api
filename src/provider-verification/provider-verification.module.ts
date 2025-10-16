import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderVerificationService } from './provider-verification.service';
import { ProviderVerificationController } from './provider-verification.controller';

@Module({
  imports: [PrismaModule],
  providers: [ProviderVerificationService],
  controllers: [ProviderVerificationController],
  exports: [ProviderVerificationService],
})
export class ProviderVerificationModule {}
