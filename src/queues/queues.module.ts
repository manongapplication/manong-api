import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
        password: process.env.REDIS_PASSWORD!,
        db: parseInt(process.env.REDIS_DB!),
      },
    }),
    OtpModule,
  ],
})
export class QueuesModule {}
