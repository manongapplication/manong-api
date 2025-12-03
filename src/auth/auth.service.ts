import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { TwilioService } from 'src/twilio/twilio.service';
import { ServiceRequestStatus, UserRole } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ReferralCodeService } from 'src/referral-code/referral-code.service';
import { CreateReferralCodeUsageDto } from 'src/referral-code-usage/dto/create-referral-code-usage.dto';
import { OtpQueueService } from 'src/queues/otp/otp-queue/otp-queue.service';
import { OtpService } from 'src/otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwt: JwtService,
    private readonly twilioService: TwilioService,
    private readonly referralCodeService: ReferralCodeService,
    private readonly otpQueueService: OtpQueueService,
    private readonly otpService: OtpService,
  ) {}

  private revokedTokens = new Set<string>();

  async register(dto: RegisterDto) {
    let user = await this.userService.findByPhone(dto.phone);

    if (!user) {
      user = await this.userService.createUser(dto.phone);
    }

    if (!user) {
      throw new Error('Failed to create user');
    }

    const token = await this.jwt.signAsync({ sub: user.id });

    // FIX: Only process referral code if BOTH code and deviceId are provided
    if (
      dto.referralCode != null &&
      dto.referralCode.trim() !== '' &&
      dto.deviceId != null
    ) {
      try {
        const usageDto: CreateReferralCodeUsageDto = {
          userId: user.id,
          deviceId: dto.deviceId,
        };
        await this.referralCodeService.createUsage(dto.referralCode, usageDto);
      } catch (error) {
        // Don't block registration if referral code fails
        console.error('Referral code processing failed:', error);
        // Continue with registration even if referral code fails
      }
    }

    return {
      token,
      user,
      ...(dto.resetPassword == true ? { resetPassword: true } : {}),
    };
  }

  async me(userId: number) {
    const user = await this.userService.findLatestById(userId, {
      givenFeedbacks: {
        include: { serviceRequest: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      userRequests: {
        where: { status: ServiceRequestStatus.completed },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    });

    return user;
  }

  async updateUser(userId: number, dto: UpdateUserDto) {
    if (dto.email != null) {
      const existingEmail = await this.userService.findByEmail(dto.email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (dto.phone) {
      const existingPhone = await this.userService.findByPhone(dto.phone);
      if (existingPhone && existingPhone.id !== userId) {
        throw new BadRequestException('Phone already in use');
      }
    }

    const updatedUser = await this.userService.updateUser(userId, dto);

    return updatedUser;
  }

  revokeToken(token: string) {
    this.revokedTokens.add(token);
  }

  isTokenRevoked(token: string) {
    return this.revokedTokens.has(token);
  }

  async registerNumber(dto: RegisterDto) {
    if (dto.phone == null) {
      throw new BadRequestException('You must put a number!');
    }

    // Use the queue instead of direct Twilio call
    const { jobId } = await this.otpQueueService.sendOTP(dto.phone);

    return {
      success: true,
      message: 'OTP is being sent. Please check your phone.',
      jobId, // Return job ID for tracking
      // In development, you might want to return a test OTP
      ...(process.env.NODE_ENV === 'development' && {
        testOTP: '123456', // For testing only
      }),
    };
  }

  async verifySms(dto: RegisterDto) {
    if (dto.phone == null || dto.code == null) {
      throw new BadRequestException('You must put the required data!');
    }

    // Verify OTP against database (not Twilio)
    const isValid = await this.otpService.verifyOTP(dto.phone, dto.code);

    if (!isValid) {
      throw new BadRequestException(
        'Oops! The code you entered is incorrect. Please try again.',
      );
    }

    return await this.register(dto);
  }

  async saveFcmToken(id: number, fcmToken: string) {
    const response = await this.userService.updateFcmToken(id, fcmToken);

    return response;
  }

  async validateUser(dto: LoginDto) {
    const { email, phone, password } = dto;

    // Find user by email or phone
    let user;
    if (email) {
      user = await this.userService.findByEmail(email);
    } else if (phone) {
      user = await this.userService.findByPhone(phone);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(dto: LoginDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.validateUser(dto);

    const payload = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      sub: user.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      email: user.email ?? null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      phone: user.phone ?? null,
    };

    const token = this.jwt.sign(payload);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const isAdmin = user.role === UserRole.admin;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { token, user, isAdmin };
  }

  async checkIfHasPassword(phone: string) {
    return await this.userService.checkIfHasPasswordByPhone(phone);
  }

  async resetPassword(userId: number, password: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      return new NotFoundException('User not found!');
    }

    return await this.userService.updatePassword(userId, password);
  }

  giveTemporaryToken(userId: number) {
    const token = this.jwt.sign({ sub: userId }, { expiresIn: '5m' });
    return token;
  }
}
