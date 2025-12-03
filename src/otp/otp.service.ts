import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class OtpService {
  private readonly MAX_ATTEMPTS = 3;
  private readonly OTP_EXPIRY_MINUTES = 5;

  constructor(
    private prisma: PrismaService,
    private twilioService: TwilioService,
  ) {}

  async verifyOTP(phone: string, code: string): Promise<boolean> {
    const otp = await this.prisma.oTP.findFirst({
      where: {
        phone,
        verified: false,
        status: 'SENT',
        expiresAt: { gt: new Date() },
        attempts: { lt: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return false;

    // Increment attempts
    await this.prisma.oTP.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    // Don't pass SID to Twilio - use default Service SID
    // Twilio Verify API uses the same Service SID for verification
    const result = await this.twilioService.sendVerificationCheckRequest({
      phone,
      code,
      // Don't pass otp.providerId - Twilio handles it internally
    });

    const verified = result?.data.status === 'approved';

    if (verified) {
      await this.prisma.oTP.update({
        where: { id: otp.id },
        data: {
          verified: true,
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });
    }

    return verified;
  }

  async getRemainingAttempts(phone: string): Promise<number> {
    const otp = await this.prisma.oTP.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return 0;
    return this.MAX_ATTEMPTS - otp.attempts;
  }
}
