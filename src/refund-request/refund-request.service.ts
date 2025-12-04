import {
  BadGatewayException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import { UpdateServiceRequestDto } from 'src/service-request/dto/update-service-request.dto';
import {
  PaymentStatus,
  PaymentTransaction,
  RefundRequest,
  RefundStatus,
  ServiceRequest,
  ServiceRequestStatus,
  UserRole,
} from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { UpdateRefundRequestDto } from './dto/update-refund-request.dto';
import { getRefundStatusMessage } from 'src/common/utils/refund.util';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';
import { FcmService } from 'src/fcm/fcm.service';

@Injectable()
export class RefundRequestService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
    private userService: UserService,
    private fcmService: FcmService,
  ) {}

  private readonly logger = new Logger(RefundRequestService.name);

  async createRefundRequest(
    userId: number,
    dto: CreateRefundRequestDto,
  ): Promise<{ data: RefundRequest | null; message: string } | null> {
    const request = await this.serviceRequestService.findById(
      dto.serviceRequestId,
    );

    if (!request) {
      throw new NotFoundException('Service Request not found!');
    }

    const refundStatus =
      request.paymentStatus == PaymentStatus.pending &&
      (request.status == ServiceRequestStatus.awaitingAcceptance ||
        request.status == ServiceRequestStatus.pending)
        ? RefundStatus.approved
        : RefundStatus.pending;

    const pendingRefund = await this.prisma.refundRequest.create({
      data: {
        serviceRequestId: dto.serviceRequestId,
        userId: userId,
        paymentTransactionId: dto.paymentTransactionId,
        reason: dto.reason,
        evidenceUrl: dto.evidenceUrl,
        handledManually: dto.handledManually,
        reviewedBy: dto.reviewedBy,
        remarks: dto.remarks,
        amount: request.total,
        status: refundStatus,
      },
    });

    let refund: RefundRequest | null = null;
    let cancelServiceRequest: {
      serviceRequest: ServiceRequest;
      paymentTransaction?: PaymentTransaction;
      message?: string;
      availableAt?: Date;
    } | null = null;

    try {
      cancelServiceRequest = await this.requestRefundCancelServiceRequest(
        userId,
        dto.serviceRequestId,
        false,
      );

      const serviceRefundRequestStatus: RefundStatus =
        cancelServiceRequest?.serviceRequest.paymentStatus ==
        PaymentStatus.refunded
          ? RefundStatus.approved
          : RefundStatus.pending;

      // Prepare update data
      const updateData: any = {
        status:
          pendingRefund.status === RefundStatus.approved
            ? RefundStatus.approved
            : serviceRefundRequestStatus,
        paymentTransactionId: cancelServiceRequest?.paymentTransaction?.id,
      };

      // Add availableAt if it exists from Paymongo
      if (cancelServiceRequest?.availableAt) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updateData.availableAt = cancelServiceRequest.availableAt;

        // Also update remarks to include the scheduled date
        const formattedDate = cancelServiceRequest.availableAt.toDateString();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        updateData.remarks = `Refund scheduled for ${formattedDate}. Our payment processor holds funds for security before refunds can be processed.`;
      }

      refund = await this.prisma.refundRequest.update({
        where: { id: pendingRefund.id },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: updateData,
      });

      await this.sendPushNotificationForManong(request.id);
    } catch (e) {
      this.logger.error(`Error refund request ${e}`);

      // Handle the specific Paymongo same-day partial refund error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (e.message?.includes('same_day_partial_refund_not_allowed')) {
        console.log(
          'Paymongo Error: Cannot partially refund for payments done on the same day',
        );

        // Update refund status to reflect the failure
        refund = await this.prisma.refundRequest.update({
          where: { id: pendingRefund.id },
          data: {
            remarks: 'Refund will be processed in 1-2 business days',
          },
        });

        return {
          data: refund,
          message:
            'Your refund is being processed and will be completed within 1-2 business days.',
        };
      }
    }

    return {
      data: refund,
      message:
        cancelServiceRequest?.message ??
        "Refund request submitted successfully! Please wait for admin review. We'll notify you once it is processed.",
    };
  }

  async requestRefundCancelServiceRequest(
    userId: number,
    serviceRequestId: number,
    isAdmin?: boolean,
  ): Promise<{
    serviceRequest: ServiceRequest;
    paymentTransaction?: PaymentTransaction;
    message?: string;
    availableAt?: Date;
  } | null> {
    const existRequest =
      await this.serviceRequestService.findById(serviceRequestId);

    if (!existRequest) {
      throw new NotFoundException('Service Request not found!');
    }

    const existingRefund = await this.prisma.refundRequest.findFirst({
      where: {
        serviceRequestId,
        status: RefundStatus.pending,
      },
    });

    if (
      existingRefund?.availableAt &&
      existingRefund.availableAt > new Date()
    ) {
      throw new BadGatewayException(
        `Funds not available until ${existingRefund.availableAt.toDateString()}. Cannot process refund yet.`,
      );
    }

    return await this.serviceRequestService.cancelServiceRequest(
      userId,
      existRequest.id,
      isAdmin,
    );
  }

  async sendPushNotificationForManong(serviceRequestId: number) {
    const request =
      await this.serviceRequestService.findByIdIncludesUserAndManong(
        serviceRequestId,
      );

    if (!request) {
      throw new NotFoundException('Service request not found!');
    }

    try {
      const title = `⚠️ ${request.user.phone} has requested a refund`;
      const body = `A refund has been requested for ${request.requestNumber}: ${request.serviceItem.title}${request.subServiceItem ? ` → ${request.subServiceItem.title}` : ''} service.`;
      const notificationDto: CreateNotificationDto = {
        token: request?.manong?.fcmToken ?? '',
        title: title,
        body: body,
        userId: request.manongId!,
      };
      await this.fcmService.sendPushNotification(notificationDto);
    } catch (e) {
      this.logger.error(`Can't message notification ${e}`);
    }
  }

  async fetchRefundRequestById(userId: number, serviceRequestId: number) {
    return await this.prisma.refundRequest.findMany({
      where: { serviceRequestId, userId },
    });
  }

  async fetchRefunds(userId: number) {
    const user = await this.userService.isAdmin(userId);

    if (!user) {
      throw new BadGatewayException('User is not admin!');
    }

    return await this.prisma.refundRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { serviceRequest: true, paymentTransaction: true },
    });
  }

  async updateRefundRequest(
    userId: number,
    id: number,
    dto: UpdateRefundRequestDto,
  ) {
    // First, verify the user is admin
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== UserRole.admin) {
      throw new BadGatewayException(
        'User not authorized to update refund requests!',
      );
    }

    const existingRefund = await this.prisma.refundRequest.findUnique({
      where: { id },
    });

    if (!existingRefund) {
      throw new NotFoundException('Refund request not found');
    }

    const updateData: any = {
      ...dto,
      reviewedBy: userId,
      reviewedAt: new Date(),
    };

    // Remove undefined fields
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.keys(updateData).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (updateData[key] === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete updateData[key];
      }
    });

    // Update the refund request
    const updatedRefund = await this.prisma.refundRequest.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
      include: {
        user: true,
      },
    });

    // If status is being updated to approved or rejected, update the related service request
    if (
      dto.status &&
      (dto.status == RefundStatus.approved ||
        dto.status == RefundStatus.rejected)
    ) {
      if (dto.status != null) {
        try {
          if (existingRefund.status != dto.status) {
            const message = getRefundStatusMessage(dto.status);
            const notificationDto: CreateNotificationDto = {
              token: updatedRefund.user.fcmToken ?? '',
              title: message.title,
              body: message.body,
              userId: updatedRefund.user.id,
            };
            await this.fcmService.sendPushNotification(notificationDto);
          }
        } catch (e) {
          this.logger.error(`Can't message notification ${e}`);
        }
      }
      let serviceRequestStatus: ServiceRequestStatus =
        ServiceRequestStatus.pending;

      if (dto.status === RefundStatus.approved) {
        serviceRequestStatus = ServiceRequestStatus.cancelled;
      } else if (dto.status === RefundStatus.rejected) {
        serviceRequestStatus = ServiceRequestStatus.completed;
      }

      if (serviceRequestStatus) {
        const updateServiceRequestDto: UpdateServiceRequestDto = {
          status: serviceRequestStatus,
        };

        await this.serviceRequestService.updateServiceRequest(
          existingRefund.serviceRequestId,
          updateServiceRequestDto,
        );
      }
    } else if (dto.status == RefundStatus.processed) {
      // Check if funds are available
      if (
        existingRefund.availableAt &&
        existingRefund.availableAt > new Date()
      ) {
        throw new BadGatewayException(
          `Funds not available until ${existingRefund.availableAt.toDateString()}. Cannot process refund yet.`,
        );
      }

      // Check if admin
      const user = await this.userService.isAdmin(userId);
      const isAdmin = user?.role === UserRole.admin;

      await this.requestRefundCancelServiceRequest(
        userId,
        existingRefund.serviceRequestId,
        isAdmin,
      );
    }

    return updatedRefund;
  }

  async processPendingRefunds(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user || user.role !== UserRole.admin) {
      throw new BadGatewayException('User not authorized!');
    }

    // Only process refunds that are at least 24 hours old
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const pendingRefunds = await this.prisma.refundRequest.findMany({
      where: {
        status: RefundStatus.pending,
        createdAt: {
          lte: twentyFourHoursAgo, // Only refunds created at least 24 hours ago
        },
      },
      include: {
        serviceRequest: true,
        paymentTransaction: true,
        user: true,
      },
    });

    const results: any = [];

    for (const refund of pendingRefunds) {
      try {
        if (refund.availableAt && refund.availableAt > new Date()) {
          // Skip this refund - funds not available yet
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          results.push({
            skipped: true,
            refundId: refund.id,
            reason: `Funds not available until ${refund.availableAt.toDateString()}`,
          });
          continue; // Skip to next refund
        }

        // Process the refund cancellation similar to updateRefundRequest
        await this.requestRefundCancelServiceRequest(
          userId,
          refund.serviceRequestId,
          true, // isAdmin = true
        );

        // Update refund status to processed
        const processedRefund = await this.prisma.refundRequest.update({
          where: { id: refund.id },
          data: {
            status: RefundStatus.processed,
            reviewedBy: userId,
            reviewedAt: new Date(),
          },
        });

        // Send notification to user
        try {
          const message = getRefundStatusMessage(RefundStatus.processed);
          const notificationDto: CreateNotificationDto = {
            token: refund.user?.fcmToken ?? '',
            title: message.title,
            body: message.body,
            userId: refund.userId,
          };
          await this.fcmService.sendPushNotification(notificationDto);
        } catch (e) {
          this.logger.error(
            `Can't send notification for refund ${refund.id}: ${e}`,
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        results.push(processedRefund);
      } catch (error) {
        this.logger.error(`Failed to process refund ${refund.id}:`, error);
        // If refund processing fails, mark it as rejected
        try {
          const failedRefund = await this.prisma.refundRequest.update({
            where: { id: refund.id },
            data: {
              status: RefundStatus.rejected,
              reviewedBy: userId,
              reviewedAt: new Date(),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              remarks: `Auto-rejected: Failed to process refund - ${error.message}`,
            },
          });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          results.push(failedRefund);
        } catch (updateError) {
          this.logger.error(
            `Failed to mark refund ${refund.id} as rejected:`,
            updateError,
          );
        }
      }
    }

    return results;
  }
}
