import {
  BadRequestException,
  Injectable,
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
    // console.log({ token, user });
    return { token, user };
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
}
