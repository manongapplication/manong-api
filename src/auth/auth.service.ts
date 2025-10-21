import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwt: JwtService,
    private readonly twilioService: TwilioService,
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
    console.log({ token, user });
    return { token, user };
  }

  async me(userId: number) {
    return this.userService.findLatestById(userId, {
      givenFeedbacks: {
        include: {
          serviceRequest: true,
        },
      },
    });
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

    const result = await this.twilioService.sendVerificationRequest(dto);

    if (result?.data.status != 'pending') {
      throw new BadRequestException("Can't send the OTP request!");
    }

    return result;
  }

  async verifySms(dto: RegisterDto) {
    if (dto.phone == null || dto.code == null) {
      throw new BadRequestException('You must put the required data!');
    }

    const result = await this.twilioService.sendVerificationCheckRequest(dto);

    if (result?.data.status != 'approved') {
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
}
