import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserPaymentMethodDto } from './dto/create-user-payment-method.dto';
import { UpdateUserPaymentMethodDto } from './dto/update-user-payment-method.dto';
import { PaymentMethodService } from 'src/payment-method/payment-method.service';

@Injectable()
export class UserPaymentMethodService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentMethodService: PaymentMethodService,
  ) {}

  async updatePaymentMethodIdOnGateway(
    id: number,
    paymentMethodIdOnGateway: string,
  ) {
    await this.prisma.userPaymentMethod.update({
      where: {
        id,
      },
      data: {
        paymentMethodIdOnGateway,
      },
    });
  }

  async deleteByPaymentMethodIdOnGateway(
    userId: number,
    paymentMethodIdOnGateway: string,
  ) {
    await this.prisma.userPaymentMethod.deleteMany({
      where: {
        userId,
        paymentMethodIdOnGateway,
      },
    });

    const defaultExists = await this.prisma.userPaymentMethod.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (!defaultExists) {
      const firstRemaining = await this.prisma.userPaymentMethod.findFirst({
        where: {
          userId,
          provider: 'paymongo',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (firstRemaining) {
        await this.prisma.userPaymentMethod.update({
          where: {
            id: firstRemaining.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return true;
  }

  async findByPaymentMethodId(id: number) {
    return this.prisma.userPaymentMethod.findFirst({
      where: { paymentMethodId: id },
    });
  }

  async getUserDefaultPaymentMethod(userId: number) {
    return this.prisma.userPaymentMethod.findFirst({
      where: { userId: userId, isDefault: true },
      include: {
        paymentMethod: true,
      },
    });
  }

  async setDefaultPaymentMethod(userId: number, id: number) {
    await this.prisma.userPaymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.userPaymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async setDefaultCardPaymentMethod(
    userId: number,
    paymentMethodIdOnGateway: string,
  ) {
    await this.prisma.userPaymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return await this.prisma.userPaymentMethod.update({
      where: {
        userId_provider_paymentMethodIdOnGateway: {
          userId,
          provider: 'paymongo',
          paymentMethodIdOnGateway,
        },
      },
      data: {
        isDefault: true,
      },
    });
  }

  async setUpdatePaymentMethodToDefault(
    userId: number,
    dto: UpdateUserPaymentMethodDto,
  ) {
    await this.prisma.userPaymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const exists = await this.prisma.userPaymentMethod.findFirst({
      where: {
        userId,
        paymentMethod: {
          code: dto.type,
        },
      },
    });

    const paymentMethod =
      await this.paymentMethodService.fetchPaymentMethodByCode(dto.type);

    if (!paymentMethod?.id) {
      throw new BadRequestException('paymentMethodId is required');
    }

    if (!exists) {
      return await this.prisma.userPaymentMethod.create({
        data: {
          userId,
          paymentMethodId: paymentMethod.id,
          provider: dto.provider ?? '',
          paymentMethodIdOnGateway: dto.paymentMethodIdOnGateway,
          last4: dto.last4,
          expMonth: dto.expMonth,
          expYear: dto.expYear,
          cardHolderName: dto.cardHolderName,
          billingEmail: dto.billingEmail,
          customerId: dto.customerId,
          isDefault: true,
        },
      });
    } else {
      return await this.prisma.userPaymentMethod.updateMany({
        where: {
          userId,
          id: exists.id,
        },
        data: {
          isDefault: true,
          paymentMethodIdOnGateway: dto.paymentMethodIdOnGateway,
          last4: dto.last4,
          expMonth: dto.expMonth,
          expYear: dto.expYear,
          cardHolderName: dto.cardHolderName,
          billingEmail: dto.billingEmail,
        },
      });
    }
  }

  async createUserPaymentMethod(
    userId: number,
    dto: CreateUserPaymentMethodDto,
  ) {
    let exists: any = null;
    let provider = '';
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: dto.paymentMethodId },
    });
    if (paymentMethod?.code == 'card') {
      provider = 'paymongo';
      const maxCards = 3;
      const count = await this.prisma.userPaymentMethod.count({
        where: {
          userId,
          paymentMethod: { code: 'card' }, // only enforce limit for cards
        },
      });
      if (count >= maxCards) {
        throw new BadRequestException({
          message: `You can only save up to ${maxCards} cards.`,
          error: 'MAX_CARDS_REACHED',
        });
      }

      exists = await this.prisma.userPaymentMethod.findFirst({
        where: {
          userId,
          paymentMethodIdOnGateway: dto.paymentMethodIdOnGateway,
        },
      });

      if (exists) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const updated = await this.setDefaultPaymentMethod(userId, exists.id);
        return { record: updated, isNew: false };
      }
    } else {
      provider =
        paymentMethod!.code == 'gcash' || paymentMethod!.code == 'paymaya'
          ? 'paymongo'
          : paymentMethod!.code;

      exists = await this.prisma.userPaymentMethod.findFirst({
        where: { userId, paymentMethodId: dto.paymentMethodId },
      });

      if (exists) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const updated = await this.setDefaultPaymentMethod(userId, exists.id);
        return { record: updated, isNew: false };
      }
    }

    const created = await this.prisma.userPaymentMethod.create({
      data: {
        userId,
        paymentMethodId: dto.paymentMethodId,
        provider: provider,
        paymentMethodIdOnGateway: dto.paymentMethodIdOnGateway,
        last4: dto.last4,
        expMonth: dto.expMonth,
        expYear: dto.expYear,
        cardHolderName: dto.cardHolderName,
        billingEmail: dto.billingEmail,
        customerId: dto.customerId,
        isDefault: true,
      },
    });

    await this.setDefaultPaymentMethod(userId, created.id);

    return { record: created, isNew: true };
  }

  async getUserPaymentMethods(userId: number) {
    return await this.prisma.userPaymentMethod.findMany({
      where: { userId },
      include: {
        paymentMethod: true,
      },
    });
  }
}
