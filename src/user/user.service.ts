import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByPhone(phone: string) {
    return await this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
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
    const { firstName, lastName, email, phone } = dto;

    if (email) {
      const existingEmail = await this.findByEmail(email);
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
}
