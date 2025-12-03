import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OtpProcessorService } from './otp-processor/otp-processor.service';
import { OtpQueueService } from './otp-queue/otp-queue.service';
import { TwilioModule } from 'src/twilio/twilio.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'otp',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    TwilioModule,
    PrismaModule,
  ],
  providers: [OtpProcessorService, OtpQueueService],
  exports: [OtpQueueService],
})
export class OtpModule {}
