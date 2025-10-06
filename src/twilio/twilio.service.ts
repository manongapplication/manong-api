import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { RegisterDto } from 'src/auth/dto/register.dto';
import {
  VerificationCheckRequest,
  VerificationRequest,
} from './types/twilio.types';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private baseUrl = 'https://verify.twilio.com/v2/';
  private headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(process.env.TWILIO_ACCOUNT_SID + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64')}`,
  };

  async sendVerificationRequest(dto: RegisterDto) {
    try {
      const verifySid = process.env.TWILIO_VERIFY_SID;

      const body = new URLSearchParams({
        To: dto.phone,
        Channel: 'sms',
      }).toString();

      const result = await axios.post<VerificationRequest>(
        `${this.baseUrl}/Services/${verifySid}/Verifications`,
        body,
        { headers: this.headers },
      );

      return result;
    } catch (e: any) {
      this.logger.error(
        'Error sending sms from twilio.',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        e?.response?.data || e.message,
      );

      // Forward error details back to controller
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        e?.response?.data?.message ||
          'Failed to send SMS. Please try again later.',
      );
    }
  }

  async sendVerificationCheckRequest(dto: RegisterDto) {
    try {
      const verifySid = process.env.TWILIO_VERIFY_SID;

      const body = new URLSearchParams({
        To: dto.phone,
        Code: dto.code ?? '',
      }).toString();

      const result = await axios.post<VerificationCheckRequest>(
        `${this.baseUrl}/Services/${verifySid}/VerificationCheck`,
        body,
        { headers: this.headers },
      );

      return result;
    } catch (e) {
      this.logger.error('Error verifying sms.', e);
    }
  }
}
