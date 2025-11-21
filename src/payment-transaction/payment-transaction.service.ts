import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { UpdatePaymentTransactionDto } from './dto/update-payment-transaction.dto';
import { getTransactionTypeMessage } from 'src/common/utils/payment-transaction.util';
import { FcmService } from 'src/fcm/fcm.service';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';

@Injectable()
export class PaymentTransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
  ) {}

  private readonly logger = new Logger(PaymentTransactionService.name);

  async createPaymentTransactionService(
    dto: CreatePaymentTransactionDto,
    metadataJson?: unknown,
  ) {
    const {
      serviceRequestId,
      userId,
      provider,
      paymentIntentId,
      paymentIdOnGateway,
      refundIdOnGateway,
      amount,
      currency,
      status,
      type,
      description,
      metadata,
    } = dto;

    const created = await this.prisma.paymentTransaction.create({
      data: {
        serviceRequestId,
        userId,
        provider,
        paymentIntentId,
        amount,
        currency,
        status,
        type,
        description,
        paymentIdOnGateway,
        refundIdOnGateway,
        metadata: metadata ?? JSON.stringify(metadataJson),
      },
    });

    return created;
  }

  async updatePaymentTransaction(
    dto: UpdatePaymentTransactionDto,
    metadata?: unknown,
  ) {
    const {
      serviceRequestId,
      userId,
      provider,
      paymentIntentId,
      amount,
      currency,
      status,
      type,
      description,
    } = dto;

    const updated = await this.prisma.paymentTransaction.create({
      data: {
        serviceRequestId,
        userId,
        provider,
        paymentIntentId,
        amount,
        currency,
        status,
        type,
        description,
        metadata: JSON.stringify(metadata),
      },
    });

    return updated;
  }

  async fetchPaymentTransactions(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return await this.prisma.paymentTransaction.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { refundRequest: true },
    });
  }

  async countUnseenPaymentTransactionsByUserId(userId: number) {
    return await this.prisma.paymentTransaction.count({
      where: { userId, seenAt: null },
    });
  }

  async countPaymentTransactionsByUserId(userId: number) {
    return await this.prisma.paymentTransaction.count({
      where: { userId },
    });
  }

  async seenAllPaymentTransactionsByUserId(userId: number) {
    const now = new Date();
    return await this.prisma.paymentTransaction.updateMany({
      where: { userId, seenAt: null },
      data: { seenAt: now },
    });
  }

  async sendPushNotificationForTransactionStatus(id: number) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!transaction) {
      return;
    }

    try {
      const message = getTransactionTypeMessage(transaction.type);
      const notificationDto: CreateNotificationDto = {
        token: transaction?.user.fcmToken ?? '',
        title: message.title,
        body: message.body,
        userId: transaction.user.id,
      };
      await this.fcmService.sendPushNotification(notificationDto);
    } catch (e) {
      this.logger.error(`Can't message notification ${e}`);
    }
  }
}
