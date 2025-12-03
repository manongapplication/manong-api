import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { TwilioService } from 'src/twilio/twilio.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('otp')
@Injectable()
export class OtpProcessorService {
  private readonly logger = new Logger(OtpProcessorService.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('send')
  async handleSendOTP(job: Job<{ phone: string; userId?: number }>) {
    const { phone, userId } = job.data;

    try {
      // Check rate limit
      const canSend = await this.checkRateLimit(phone);
      if (!canSend) {
        throw new Error(
          `Rate limit exceeded for ${phone}. Try again in 1 hour.`,
        );
      }

      // Send via Twilio - THEY generate the OTP
      const result = await this.twilioService.sendVerificationRequest({
        phone,
      });

      if (result?.data.status !== 'pending') {
        throw new Error('Failed to send OTP via Twilio');
      }

      // Extract OTP from Twilio response or wait for webhook
      // Since Twilio doesn't return OTP in response, we need to:

      // OPTION A: Store with providerId only (you'll verify via Twilio API)
      const otpRecord = await this.prisma.oTP.create({
        data: {
          phone,
          code: 'PENDING', // Placeholder - real OTP is with Twilio
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          attempts: 0,
          verified: false,
          method: 'SMS',
          provider: 'Twilio',
          providerId: result.data.sid, // Store Twilio verification SID
          status: 'SENT',
          userId: userId,
        },
      });

      this.logger.log(
        `OTP sent via Twilio to ${phone}, SID: ${result.data.sid}`,
      );

      return {
        success: true,
        phone,
        providerSid: result.data.sid,
        otpId: otpRecord.id,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`❌ Failed to send OTP to ${phone}:`, error.message);

      // Log failure in database
      await this.prisma.oTP.create({
        data: {
          phone,
          code: 'FAILED',
          expiresAt: new Date(),
          verified: false,
          status: 'FAILED',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          errorMessage: error.message,
          userId: userId,
        },
      });

      throw error;
    }
  }

  private async checkRateLimit(phone: string): Promise<boolean> {
    const attempts = await this.prisma.oTP.count({
      where: {
        phone,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    return attempts < 5;
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.debug(`Completed job ${job.id} with result:`, result);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id}:`, error.message);
  }
}
