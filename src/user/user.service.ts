import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompleteProfileUserDto } from './dto/complete-profile-user.dto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ProviderVerificationService } from 'src/provider-verification/provider-verification.service';
import { CreateProviderVerificationDto } from 'src/provider-verification/dto/create-provider-verification.dto';
import { AccountStatus, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerVerificationService: ProviderVerificationService,
  ) {}

  async findByPhone(phone: string) {
    return await this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdIncludes(id: number, include?: Prisma.UserInclude) {
    return this.prisma.user.findUnique({
      where: { id },
      include,
    });
  }

  async findLatestById(id: number, include?: Prisma.UserInclude) {
    return this.prisma.user.findFirst({
      where: { id },
      include,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findFirst({ where: { email } });
  }

  async createUser(phone: string) {
    const user = await this.prisma.user.create({ data: { phone } });

    // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    // const paymentMethods = await this.prisma.paymentMethod.findMany({
    //   where: { isActive: true },
    // });

    // await Promise.all(
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    //   paymentMethods.map((method, index) =>
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    //     this.prisma.userPaymentMethod.create({
    //       data: {
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    //         userId: user.id,
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    //         paymentMethodId: method.id,
    //         isDefault: index === 0,
    //       },
    //     }),
    //   ),
    // );

    return user;
  }

  async updateUser(userId: number, dto: UpdateUserDto) {
    const { firstName, lastName, email, phone, hasSeenVerificationCongrats } =
      dto;

    if (email) {
      const normalizedEmail = email.toLowerCase();
      const existingEmail = await this.findByEmail(normalizedEmail);
      if (existingEmail && existingEmail.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (phone) {
      const existingPhone = await this.findByPhone(phone);
      if (existingPhone && existingPhone.id !== userId) {
        throw new BadRequestException('Phone already in use');
      }
    }

    const user = await this.findById(userId);

    const updatedUser = this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName ?? user?.firstName,
        lastName: lastName ?? user?.lastName,
        email: email ?? user?.email,
        phone: phone ?? user?.phone,
        hasSeenVerificationCongrats:
          hasSeenVerificationCongrats ?? user?.hasSeenVerificationCongrats,
      },
    });

    return updatedUser;
  }

  async updateLastKnownLatLng(id: number, latitude: number, longitude: number) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        lastKnownLat: latitude,
        lastKnownLng: longitude,
      },
    });

    return updated;
  }

  async updateFcmToken(id: number, fcmToken: string) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fcmToken: fcmToken,
      },
    });

    return updated;
  }

  async completeProfile(userId: number, dto: CompleteProfileUserDto) {
    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase();
      const existingEmail = await this.findByEmail(normalizedEmail);
      if (existingEmail && existingEmail.id !== userId) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (!dto.validId) {
      throw new BadRequestException('Valid ID is required!');
    }

    const dest = join('uploads', 'valid_id', String(userId));
    await fs.mkdir(dest, { recursive: true });

    const timestamp = Date.now();
    const fileExt = dto.validId.originalname.split('.').pop();
    const fileName = `valid_id_${timestamp}.${fileExt}`;
    const filePath = join(dest, fileName);

    await fs.writeFile(filePath, dto.validId.buffer);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        nickname: dto.nickname,
        email: dto.email,
        addressCategory: dto.addressCategory,
        addressLine: dto.addressLine,
        status: AccountStatus.onHold,
      },
    });

    const providerVerification: CreateProviderVerificationDto = {
      userId,
      documentType: dto.validIdType,
      documentUrl: filePath,
    };

    await this.providerVerificationService.createProviderVerification(
      userId,
      providerVerification,
    );

    return updated;
  }
}
