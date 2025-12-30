import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompleteProfileUserDto } from './dto/complete-profile-user.dto';
import { join } from 'path';
import { promises as fs } from 'fs';
import { ProviderVerificationService } from 'src/provider-verification/provider-verification.service';
import { CreateProviderVerificationDto } from 'src/provider-verification/dto/create-provider-verification.dto';
import { AccountStatus, Prisma, UserRole } from '@prisma/client';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';
import { FcmService } from 'src/fcm/fcm.service';
import { getAccountStatusMessage } from 'src/common/utils/account.util';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerVerificationService: ProviderVerificationService,
    private readonly fcmService: FcmService,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async findByPhone(phone: string) {
    return await this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async isAdmin(id: number) {
    return await this.prisma.user.findUnique({
      where: { id, role: UserRole.admin },
    });
  }

  async isManong(id: number) {
    return await this.prisma.user.findUnique({
      where: { id, role: UserRole.manong },
    });
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
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findFirst({ where: { email } });
  }

  async checkIfHasPasswordByPhone(phone: string) {
    const user = await this.findByPhone(phone);

    if (!user) {
      return false;
    }

    if (user.password != null) {
      return true;
    }

    return false;
  }

  async deleteById(id: number) {
    return await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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
    const {
      firstName,
      lastName,
      email,
      phone,
      hasSeenVerificationCongrats,
      password,
    } = dto;

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

    if (!user) {
      return new NotFoundException('User not found!');
    }

    if (dto.status != null) {
      try {
        if (user.status != dto.status) {
          const message = getAccountStatusMessage(dto.status);
          const notificationDto: CreateNotificationDto = {
            token: user.fcmToken ?? '',
            title: message.title,
            body: message.body,
            userId: user.id,
          };

          await this.fcmService.sendPushNotification(notificationDto);
        }
      } catch (e) {
        this.logger.error(`Can't message notification ${e}`);
      }
    }
    const updatedUser = this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName ?? user?.firstName,
        lastName: lastName ?? user?.lastName,
        email: email ?? user?.email,
        phone: phone ?? user?.phone,
        hasSeenVerificationCongrats:
          hasSeenVerificationCongrats ?? user?.hasSeenVerificationCongrats,
        addressLine: dto.addressLine,
        status: dto.status,
        password:
          password != null ? await bcrypt.hash(password, 10) : user?.password,
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

    const currentUser = await this.findById(userId);

    const updateData: any = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      nickname: dto.nickname,
      email: dto.email,
      addressCategory: dto.addressCategory,
      addressLine: dto.addressLine,
      status: AccountStatus.onHold,
    };

    if (
      dto.password &&
      (!currentUser?.password || currentUser.password === '')
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
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

  async updatePassword(userId: number, password: string) {
    const user = await this.findById(userId);

    if (!user) {
      return new NotFoundException('User not found!');
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(password, 10),
      },
    });
  }

  async fetchUsers(userId: number, page = 1, limit = 10, search?: string) {
    const user = await this.findById(userId);

    if (!user) return;

    if (user.role != UserRole.admin) {
      throw new BadGatewayException('Is not admin!');
    }

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: UserRole.customer,
    };

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        {
          AND: [
            {
              firstName: {
                contains: searchTerm.split(' ')[0],
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: searchTerm.split(' ')[1] || searchTerm.split(' ')[0],
                mode: 'insensitive',
              },
            },
          ],
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      include: {
        providerVerifications: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit * 2,
    });

    return users;
  }

  async deleteUser(userId: number, id: number) {
    const now = new Date();

    const userLoggedIn = await this.findById(userId);

    if (!userLoggedIn) {
      throw new BadGatewayException('User not logged in!');
    }

    if (userLoggedIn.role != UserRole.admin) {
      throw new BadGatewayException('User is not admin!');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: now, status: AccountStatus.deleted },
    });

    return { id };
  }

  async bulkDeleteUsers(userId: number, ids: number[]) {
    const now = new Date();

    const userLoggedIn = await this.findById(userId);

    if (!userLoggedIn) {
      throw new BadGatewayException('User not logged in!');
    }

    if (userLoggedIn.role != UserRole.admin) {
      throw new BadGatewayException('User is not admin!');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
    });

    if (!users.length) {
      throw new NotFoundException('No Users found for given IDs');
    }

    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: now, status: AccountStatus.deleted },
    });

    return { deletedCount: users.length, ids };
  }
}
