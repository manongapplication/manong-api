import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import dayjs from 'dayjs';
import { join } from 'path';
import { promises as fs } from 'fs';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import {
  AccountStatus,
  PaymentStatus,
  PaymentTransaction,
  Prisma,
  ServiceRequest,
  ServiceRequestStatus,
  TransactionType,
  UserRole,
} from '@prisma/client';
import { CalculationUtil } from 'src/common/utils/calculation.util';
import { UserPaymentMethodService } from 'src/user-payment-method/user-payment-method.service';
import { PaymongoService } from 'src/paymongo/paymongo.service';
import { UpdateDataServiceRequestDto } from './dto/update-data-service-request.dto';
import axios from 'axios';
import { PaymongoError } from 'src/paymongo/types/paymongo-error.types';
import { CreatePaymentIntentDto } from 'src/paymongo/dto/create-payment-intent.dto';
import { CompleteServiceRequestDto } from './dto/complete-service-request.dto';
import { CompleteServiceRequest } from './types/service-request.types';
import {
  mapPaymongoRefundStatus,
  mapPaymongoStatus,
} from 'src/common/utils/payment.util';
import { UserService } from 'src/user/user.service';
import { FcmService } from 'src/fcm/fcm.service';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';
import { generateRequestNumber } from 'src/common/utils/request.util';
import { PaymentTransactionService } from 'src/payment-transaction/payment-transaction.service';
import { CreatePaymentTransactionDto } from 'src/payment-transaction/dto/create-payment-transaction.dto';
import { RefundRequestService } from 'src/refund-request/refund-request.service';
import { PaymongoRefund } from 'src/paymongo/types/paymongo.types';
import { calculateRefundAmount } from 'src/common/utils/refund.util';

@Injectable()
export class ServiceRequestService {
  private readonly logger = new Logger(ServiceRequestService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly userPaymentMethodService: UserPaymentMethodService,
    private readonly paymongoService: PaymongoService,
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
    private readonly paymentTransactionService: PaymentTransactionService,
    private readonly refundRequestService: RefundRequestService,
  ) {}

  async findById(id: number) {
    return this.prisma.serviceRequest.findUnique({ where: { id } });
  }

  async findByIdIncludes(id: number, include?: Prisma.ServiceRequestInclude) {
    return this.prisma.serviceRequest.findUnique({
      where: { id },
      include,
    });
  }

  async findByIdIncludesPaymentTransaction(id: number) {
    return this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        paymentTransactions: true,
      },
    });
  }

  async findByIdIncludesUserAndManong(id: number) {
    return this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        user: true,
        manong: true,
        serviceItem: true,
        subServiceItem: true,
      },
    });
  }

  async findByManongIdAndCount(id: number) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    return this.prisma.serviceRequest.count({
      where: {
        manongId: id,
        createdAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
      },
    });
  }

  async findOrFail(id: number) {
    try {
      return await this.prisma.serviceRequest.findUniqueOrThrow({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
  }

  async createServiceRequest(userId: number, dto: CreateServiceRequestDto) {
    const user = await this.userService.findById(userId);
    if (
      user?.status == AccountStatus.pending ||
      user?.status == AccountStatus.onHold
    ) {
      return {
        warning:
          'Account on hold. Please wait before you can use our services.',
        duplicate: false,
      };
    }

    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    // Check if a service request already exists today for this user and service
    const existingRequest = await this.prisma.serviceRequest.findFirst({
      where: {
        userId,
        serviceItemId: dto.serviceItemId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        serviceItem: true,
        subServiceItem: true,
      },
    });

    // Prevent creation if request exists
    if (existingRequest) {
      return {
        created: existingRequest,
        warning: existingRequest.manongId
          ? 'Service already requested today. Try again tomorrow or choose a different service.'
          : "You already booked this service but haven't chosen a manong yet.",
        duplicate: true,
      };
    }

    // Validate images count
    if (!dto.images || dto.images.length < 1 || dto.images.length > 3) {
      return {
        created: null,
        warning: 'You must upload between 1 and 3 images to continue.',
        duplicate: false,
      };
    }

    // Save uploaded images
    const imagePaths: string[] = [];
    for (const file of dto.images) {
      const dest = join('uploads', 'service_requests', String(userId));
      await fs.mkdir(dest, { recursive: true });
      const filePath = join(dest, file.originalname);
      await fs.writeFile(filePath, file.buffer);
      imagePaths.push(filePath);
    }

    const requestNumber = generateRequestNumber();

    // Create the service request
    const created = await this.prisma.serviceRequest.create({
      data: {
        userId,
        requestNumber,
        serviceItemId: dto.serviceItemId,
        subServiceItemId: dto.subServiceItemId,
        paymentMethodId: dto.paymentMethodId,
        urgencyLevelId: dto.urgencyLevelId,
        otherServiceName: dto.otherServiceName,
        serviceDetails: dto.serviceDetails,
        imagesPath: JSON.stringify(imagePaths),
        customerFullAddress: dto.customerFullAddress,
        customerLat: dto.customerLat!,
        customerLng: dto.customerLng!,
        status: dto.status ?? ServiceRequestStatus.pending,
      },
      include: {
        serviceItem: true,
        subServiceItem: true,
      },
    });

    return { created, warning: null, duplicate: false };
  }

  async fetchServiceRequestsByUserId(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const user = await this.userService.findById(userId);

    let where = {};

    const role = user?.role;

    if (role == UserRole.manong) {
      where = { manongId: userId };
    } else {
      where = { userId };
    }

    const isManong = role == UserRole.manong;

    const requests = await this.prisma.serviceRequest.findMany({
      where: where,
      include: {
        user: true,
        manong: true,
        serviceItem: true,
        subServiceItem: true,
        urgencyLevel: true,
        paymentMethod: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          where: {
            receiverId: userId,
          },
        },
        feedback: true,
        paymentTransactions: {
          include: {
            refundRequest: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        refundRequests: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: requests.map((req) => ({
        ...req,
        imagesPath: req.imagesPath,
      })),
      isManong: isManong,
    };
  }

  async updateServiceRequest(id: number, dto: UpdateServiceRequestDto) {
    const request = await this.findOrFail(id);

    if (!request) {
      throw new NotFoundException(`ServiceRequest with id ${id} not found`);
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        serviceItemId: dto.serviceItemId,
        subServiceItemId: dto.subServiceItemId,
        paymentMethodId: dto.paymentMethodId,
        urgencyLevelId: dto.urgencyLevelId,
        otherServiceName: dto.otherServiceName,
        serviceDetails: dto.serviceDetails,
        customerLat: dto.customerLat,
        customerLng: dto.customerLng,
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        deletedAt: dto.deletedAt,
        arrivedAt: dto.arrivedAt,
      },
      include: {
        paymentTransactions: true,
      },
    });

    const latest = await this.prisma.paymentTransaction.findFirst({
      where: { serviceRequestId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (
      latest &&
      dto.paymentStatus !== undefined &&
      dto.paymentStatus !== null
    ) {
      await this.prisma.paymentTransaction.update({
        where: { id: latest.id },
        data: {
          status: dto.paymentStatus,
          ...(dto.paymentIdOnGateway && {
            paymentIdOnGateway: dto.paymentIdOnGateway,
          }),
          ...(dto.refundIdOnGateway && {
            refundIdOnGateway: dto.refundIdOnGateway,
          }),
        },
      });
    }

    return updated;
  }

  async updateServiceRequestPaymentStatus(
    id: number,
    paymentStatus: PaymentStatus,
  ) {
    const request = await this.findOrFail(id);

    if (!request) {
      throw new NotFoundException(`ServiceRequest with id ${id} not found`);
    }

    return await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        paymentStatus,
      },
      include: {
        paymentTransactions: true,
      },
    });
  }

  async updateServiceRequestStatusForRefund(
    id: number,
    dto: UpdateServiceRequestDto,
  ) {
    const request = await this.findOrFail(id);

    if (!request) {
      throw new NotFoundException(`ServiceRequest with id ${id} not found`);
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        paymentStatus: dto.paymentStatus,
        paymentTransactions: {
          updateMany: {
            where: { type: TransactionType.payment },
            data: {
              refundIdOnGateway: dto.refundIdOnGateway,
            },
          },
        },
      },
    });

    return updated;
  }

  async showUserServiceRequest(id: number, userId: number) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, userId },
      include: {
        user: true,
        manong: true,
        serviceItem: true,
        subServiceItem: true,
        urgencyLevel: true,
        paymentMethod: true,
        refundRequests: true,
      },
    });

    return {
      ...request,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      imagesPath:
        request?.imagesPath != null && typeof request?.imagesPath == 'string'
          ? JSON.parse(request.imagesPath)
          : request?.imagesPath || [],
    };
  }

  async showServiceRequest(id: number) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id },
      include: {
        user: true,
        manong: {
          include: {
            manongProfile: {
              include: {
                manongSpecialities: {
                  include: {
                    subServiceItem: true,
                  },
                },
                manongAssistants: true,
              },
            },
          },
        },
        serviceItem: true,
        subServiceItem: true,
        urgencyLevel: true,
        paymentMethod: true,
        feedback: true,
        paymentTransactions: true,
        refundRequests: true,
        manongReport: true,
      },
    });

    return {
      ...request,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      imagesPath:
        request?.imagesPath != null && typeof request?.imagesPath == 'string'
          ? JSON.parse(request.imagesPath)
          : request?.imagesPath || [],
    };
  }

  async updateServiceRequestData(
    userId: number,
    updateData: UpdateDataServiceRequestDto,
    dto: CompleteServiceRequestDto,
    serviceRequestId: number,
    subServiceItemTitle?: string | null,
  ) {
    try {
      const description = `Service Request ${subServiceItemTitle} with an amount of ${updateData.total}`;
      const intentDto: CreatePaymentIntentDto = {
        amount: updateData.total ?? 0,
        currency: dto.currency ?? 'PHP',
        description: description ?? '',
        capture_type: dto.capture_type ?? 'automatic',
      };

      this.logger.debug(
        `updateServiceRequestData ${JSON.stringify(intentDto)}`,
      );

      const result = await this.paymongoService.createPayment(
        userId,
        intentDto,
        serviceRequestId,
      );

      let paymentStatus: string;

      if (result.data.attributes.payments.length > 0) {
        paymentStatus = result.data.attributes.payments[0].attributes.status;
      } else {
        paymentStatus = result.data.attributes.status;
      }

      this.logger.debug(`paymentStatus ${paymentStatus}`);

      updateData.paymentStatus = mapPaymongoStatus(paymentStatus);
      dto.paymentStatus = updateData.paymentStatus;
      updateData.paymentIntentId = result.data.id;
      updateData.paymentRedirectUrl =
        result.data.attributes.next_action?.redirect?.url ?? null;
    } catch (err) {
      // Handle PayMongo error safely
      const paymongoError = axios.isAxiosError(err)
        ? (err.response?.data as PaymongoError | undefined)
        : undefined;

      updateData.paymentStatus = PaymentStatus.failed;
      updateData.status = 'failed';
      updateData.notes = paymongoError?.errors?.[0]?.detail ?? 'Payment failed';
    }
  }

  async completeServiceRequest(
    id: number,
    userId: number,
    dto: CompleteServiceRequestDto,
  ): Promise<CompleteServiceRequest | UpdateDataServiceRequestDto> {
    const exists = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        paymentMethod: true,
        subServiceItem: true,
        urgencyLevel: true,
        serviceItem: true,
      },
    });

    if (!exists) {
      throw new NotFoundException(`Service request with id ${id} not found`);
    }

    if (exists.manongId != null) {
      throw new BadRequestException({
        message: 'This service request already has a manong assigned',
        data: exists,
      });
    }

    const paymentMethod = exists.paymentMethod;

    const updateData: UpdateDataServiceRequestDto = {};

    if (paymentMethod == null) {
      throw new BadRequestException('Payment method must not be empty!');
    }

    updateData.manongId = dto.manongId;

    updateData.total = CalculationUtil.calculateTotal(exists);

    switch (paymentMethod?.code) {
      case 'cash':
        updateData.paymentStatus = PaymentStatus.pending;
        updateData.status = 'awaitingAcceptance';
        break;
      case 'card':
        {
          await this.updateServiceRequestData(
            userId,
            updateData,
            dto,
            exists.id,
            exists.subServiceItem?.title,
          );
        }

        break;
      case 'gcash':
        {
          await this.updateServiceRequestData(
            userId,
            updateData,
            dto,
            exists.id,
            exists.subServiceItem?.title,
          );
          this.logger.debug('Gcash payment!');
        }
        break;
      case 'paymaya':
        {
          await this.updateServiceRequestData(
            userId,
            updateData,
            dto,
            exists.id,
            exists.subServiceItem?.title,
          );
          this.logger.debug('Maya payment!');
        }
        break;

      default:
        updateData.paymentStatus = PaymentStatus.failed;
        updateData.status = 'failed';
        break;
    }

    if (updateData.manongId) {
      updateData.manong = { connect: { id: updateData.manongId } };
      delete updateData.manongId;
    }

    const metadata = {
      requestNumber: exists.requestNumber,
      userId: userId,
      serviceType: exists.serviceItem.title,
      subServiceType: exists.subServiceItem?.title,
    };

    if (paymentMethod?.code != 'cash') {
      updateData.paymentTransactions = {
        create: {
          user: { connect: { id: userId } },
          provider: paymentMethod.code,
          amount: updateData.total ?? 0,
          currency: dto.currency,
          status: dto.paymentStatus,
          type: TransactionType.payment,
        },
      };

      if (updateData.paymentIntentId || updateData.paymentRedirectUrl) {
        updateData.paymentTransactions = {
          create: {
            user: { connect: { id: userId } },
            provider: paymentMethod.code,
            amount: updateData.total ?? 0,
            currency: dto.currency,
            status: dto.paymentStatus,
            type: TransactionType.payment,
            paymentIntentId: updateData.paymentIntentId!,
            metadata: JSON.stringify({
              ...metadata,
              paymentRedirectUrl: updateData.paymentRedirectUrl,
            }),
          },
        };

        delete updateData.paymentIntentId;
        delete updateData.paymentRedirectUrl;
      }
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      include: {
        manong: true,
        user: true,
        serviceItem: true,
        subServiceItem: true,
        paymentTransactions: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData as any,
    });

    const notificationDto: CreateNotificationDto = {
      token: updated.manong?.fcmToken ?? '',
      title: `You've got a ${updated?.serviceItem?.title ?? 'service'} request!`,
      body: `A customer has requested your ${updated?.subServiceItem?.title} service. Please check the app for details.`,
      userId: updated.manongId!,
      serviceRequestId: updated.id.toString(),
      paymentStatus: updated.paymentStatus,
    };

    try {
      await this.fcmService.sendPushNotification(notificationDto);
    } catch (error) {
      this.logger.error(`Error sending notification ${error}`);
      throw error;
    }

    return { ...updated };
  }

  async acceptServiceRequest(userId: number, id: number) {
    const user = await this.userService.findById(userId);

    if (user?.role != UserRole.manong && user?.role != UserRole.admin) {
      throw new Error('Not authorized to start the request.');
    }

    const result = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: ServiceRequestStatus.accepted,
      },
    });

    return result;
  }

  async startServiceRequest(userId: number, id: number) {
    const user = await this.userService.findById(userId);

    if (user?.role != UserRole.manong && user?.role != UserRole.admin) {
      throw new Error('Not authorized to start the request.');
    }

    const ongoing = await this.prisma.serviceRequest.findFirst({
      where: {
        manongId: userId,
        status: ServiceRequestStatus.inProgress,
        refundRequests: { none: {} },
      },
    });

    if (ongoing) {
      throw new Error('You already have an ongoing request.');
    }

    const result = this.prisma.serviceRequest.update({
      where: {
        id,
      },
      data: {
        status: ServiceRequestStatus.inProgress,
      },
    });

    return result;
  }

  async getOngoingServiceRequest(userId: number) {
    const user = await this.userService.findById(userId);

    let where = {};

    const role = user?.role;

    if (role == UserRole.manong) {
      where = { manongId: userId };
    } else {
      where = { userId };
    }

    const isManong = role == UserRole.manong;

    const ongoing = await this.prisma.serviceRequest.findFirst({
      where: {
        ...where,
        status: ServiceRequestStatus.inProgress,
        refundRequests: { none: {} },
      },
      include: {
        user: true,
        manong: {
          include: {
            manongProfile: {
              include: {
                manongSpecialities: {
                  include: {
                    subServiceItem: true,
                  },
                },
              },
            },
          },
        },
        serviceItem: true,
        subServiceItem: true,
        urgencyLevel: true,
        refundRequests: true,
      },
    });

    return {
      data: ongoing,
      isManong: isManong,
    };
  }

  async getStatusById(id: number) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });
    return request?.status;
  }

  async cancelServiceRequest(
    userId: number,
    id: number,
    isAdmin?: boolean,
  ): Promise<{
    serviceRequest: ServiceRequest;
    paymentTransaction?: PaymentTransaction;
    message?: string;
    availableAt?: Date;
  } | null> {
    const data = await this.prisma.serviceRequest.findUnique({
      where: {
        id,
      },
      include: {
        paymentTransactions: true,
        serviceItem: true,
        subServiceItem: true,
      },
    });

    if (!data) {
      throw new NotFoundException('Service request not found!');
    }

    let status: ServiceRequestStatus = ServiceRequestStatus.cancelled;
    let paymentStatus: PaymentStatus | null = PaymentStatus.unpaid;
    let availableAt: Date | null = null;

    const userIdFinal = isAdmin ? data.userId : userId;

    try {
      // If payment was made, process refund
      let refunding: {
        data: PaymongoRefund;
        refundAmount: number;
      } | null = null;

      if (data.paymentStatus == PaymentStatus.paid) {
        const paymentId = data.paymentTransactions[0]?.paymentIdOnGateway;

        if (paymentId) {
          try {
            // Call canRefundPayment to check eligibility and get available date
            const eligibility =
              await this.paymongoService.canRefundPayment(paymentId);

            if (!eligibility.canRefund && eligibility.availableDate) {
              // Funds are held until a specific date
              availableAt = eligibility.availableDate;
              const message = `Refund scheduled for ${availableAt.toDateString()}. Our payment processor holds funds for security before refunds can be processed.`;

              // Update service request
              const updated = await this.prisma.serviceRequest.update({
                where: {
                  id,
                  userId: userIdFinal,
                },
                data: {
                  deletedAt: new Date(),
                  refundRequests: {
                    updateMany: {
                      where: {},
                      data: {
                        remarks: message,
                        status: 'pending',
                        ...(availableAt && { availableAt }),
                      },
                    },
                  },
                },
                include: {
                  paymentTransactions: true,
                  refundRequests: true,
                },
              });

              return {
                serviceRequest: updated,
                message,
                availableAt,
              };
            }
          } catch (eligibilityError) {
            this.logger.error(
              `Error checking refund eligibility: ${eligibilityError}`,
            );
          }
        }
        // Request refund from PayMongo
        refunding = await this.paymongoService.requestRefund(
          userIdFinal,
          data.id,
        );

        if (!refunding) {
          throw new BadGatewayException(
            'Failed to process refund with payment gateway',
          );
        }

        // Fetch refund status to confirm
        const fetchedRefund = await this.paymongoService.fetchRefund(
          userIdFinal,
          data.id,
        );

        if (!fetchedRefund) {
          throw new BadGatewayException('Failed to verify refund status');
        }

        // Use the most current refund status
        const finalRefundStatus =
          fetchedRefund?.data.attributes.status ??
          refunding?.data.data.attributes.status;
        paymentStatus = mapPaymongoRefundStatus(finalRefundStatus);
        console.log(finalRefundStatus);

        // If refund failed, throw error to stop the process
        if (paymentStatus === PaymentStatus.failed) {
          throw new BadGatewayException(
            `Refund processing failed with status: ${finalRefundStatus}`,
          );
        }

        status = ServiceRequestStatus.cancelled;
      }

      // Update service request status
      const updated = await this.prisma.serviceRequest.update({
        where: {
          id,
          userId: userIdFinal,
        },
        data: {
          status: status,
          deletedAt: new Date(),
          ...(paymentStatus != null && {
            paymentStatus: paymentStatus,
          }),
        },
        include: {
          paymentTransactions: true,
          refundRequests: true,
        },
      });

      let transaction: PaymentTransaction | null = null;

      // Create refund transaction record only if refund was successful
      if (data.paymentStatus == PaymentStatus.paid && paymentStatus) {
        const paymentTransactions: CreatePaymentTransactionDto = {
          userId: userIdFinal,
          serviceRequestId: updated.id,
          provider: updated.paymentTransactions[0].provider ?? 'unknown',
          amount:
            refunding?.refundAmount ??
            Number(updated.paymentTransactions[0].amount),
          currency: updated.paymentTransactions[0].currency ?? 'PHP',
          status: paymentStatus,
          type: TransactionType.refund,
          paymentIntentId: updated.paymentTransactions[0].paymentIntentId,
          paymentIdOnGateway: updated.paymentTransactions[0].paymentIdOnGateway,
          refundIdOnGateway: updated.paymentTransactions[0].refundIdOnGateway,
          metadata: updated.paymentTransactions[0].metadata,
        };

        transaction =
          await this.paymentTransactionService.createPaymentTransactionService(
            paymentTransactions,
          );

        await this.paymentTransactionService.sendPushNotificationForTransactionStatus(
          transaction.id,
        );
      }

      return {
        serviceRequest: updated,
        ...(transaction != null && { paymentTransaction: transaction }),
        ...(availableAt && { availableAt }),
        message:
          "Refund request submitted successfully! Please wait for admin review. We'll notify you once it is processed..",
      };
    } catch (error) {
      // Handle the specific Paymongo same-day partial refund error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (error.message?.includes('same_day_partial_refund_not_allowed')) {
        console.log(
          'Paymongo Error: Cannot partially refund for payments done on the same day',
        );

        const refundAmount = calculateRefundAmount(
          data.status!,
          Number(data.paymentTransactions[0].amount),
        );

        // Update service request to reflect the manual processing needed
        const updated = await this.prisma.serviceRequest.update({
          where: {
            id,
            userId: userIdFinal,
          },
          data: {
            refundRequests: {
              updateMany: {
                where: {},
                data: {
                  remarks: `Partial refund of ₱${refundAmount} - Same-day payment requires manual processing. Refund will be processed in 1-2 business days.`,
                },
              },
            },
          },
          include: {
            paymentTransactions: true,
            refundRequests: true,
          },
        });

        return {
          serviceRequest: updated,
          message: `Partial refund of ₱${refundAmount} - Same-day payment requires manual processing. Refund will be processed in 1-2 business days.`,
        };
      }

      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        error.message?.includes('available_balance_insufficient') ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        error.message?.includes('Funds will be available')
      ) {
        // Extract date from error message
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, prettier/prettier, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const dateMatch = error.message.match(
          /available for refund on (.+?) \(/,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const availableDate = dateMatch ? dateMatch[1] : 'in 3-7 days';

        // Update service request
        const updated = await this.prisma.serviceRequest.update({
          where: {
            id,
            userId: userIdFinal,
          },
          data: {
            refundRequests: {
              updateMany: {
                where: {},
                data: {
                  remarks: `Refund scheduled for ${availableDate}. Our payment processor holds funds for security before refunds can be processed.`,
                  status: 'pending',
                  ...(availableAt && { availableAt }),
                },
              },
            },
          },
          include: {
            paymentTransactions: true,
            refundRequests: true,
          },
        });

        return {
          serviceRequest: updated,
          message: `Refund scheduled for ${availableDate}. Our payment processor holds funds for security before refunds can be processed.`,
          ...(availableAt && { availableAt }),
        };
      }

      // If it's already a known exception, re-throw it
      if (
        error instanceof NotFoundException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      // Log unexpected errors and throw
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error(`Error cancelling service request: ${error.message}`);
      throw new BadGatewayException(
        'Failed to cancel service request due to payment processing error',
      );
    }
  }

  async expiredServiceRequest(userId: number, id: number) {
    const exists = await this.prisma.serviceRequest.findUnique({
      where: {
        id,
      },
    });

    if (!exists) {
      this.logger.error(`Service request ${id} not found for user ${userId}`);
      throw new NotFoundException(
        `Service request ${id} not found for user ${userId}`,
      );
    }

    let data = {};

    if (exists.arrivedAt == null) {
      if (exists.paymentStatus == PaymentStatus.paid) {
        data = { status: ServiceRequestStatus.refunding };
      } else {
        data = {
          status: ServiceRequestStatus.expired,
          deletedAt: new Date(),
        };
      }
    } else if (exists.status == ServiceRequestStatus.inProgress) {
      data = { status: ServiceRequestStatus.completed };
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: exists.id },
      data,
    });

    this.logger.debug(`Service now expired ${JSON.stringify(updated)}`);

    return updated;
  }

  async markServiceRequestCompleted(id: number, userId: number) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        refundRequests: true,
        manong: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Service request not found!');
    }

    // Check if the user is the assigned Manong
    if (request.manongId !== userId) {
      throw new BadRequestException(
        'Only the assigned Manong can mark this service as completed.',
      );
    }

    // Check if there are any refund requests
    if (request.refundRequests && request.refundRequests.length > 0) {
      throw new BadRequestException(
        'Cannot complete service request with active refund requests. Please resolve refund requests first.',
      );
    }

    const completed = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: ServiceRequestStatus.completed,
        paymentStatus: PaymentStatus.paid,
      },
      include: {
        user: true,
        paymentMethod: true,
        serviceItem: true,
        subServiceItem: true,
      },
    });

    if (completed.paymentMethod?.code == 'cash') {
      const metadata = {
        requestNumber: completed.requestNumber,
        userId: completed.userId,
        serviceType: completed.serviceItem.title,
        subServiceType: completed.subServiceItem?.title,
      };
      const paymentTransactions: CreatePaymentTransactionDto = {
        userId: completed.userId,
        serviceRequestId: completed.id,
        provider: completed.paymentMethod.code,
        amount: Number(completed.total),
        currency: 'PHP',
        status: PaymentStatus.paid,
        type: TransactionType.payment,
        handledManually: true,
        metadata: JSON.stringify(metadata),
      };

      await this.paymentTransactionService.createPaymentTransactionService(
        paymentTransactions,
      );
    }

    const notificationDto: CreateNotificationDto = {
      token: completed.user?.fcmToken ?? '',
      title: 'How was your service request?',
      body: 'Thank you for choosing Manong! We’d love to hear about your experience — leave a review to help others and support our hardworking Manongs.',
      userId: completed.userId,
      serviceRequestId: completed.id.toString(),
      paymentStatus: completed.paymentStatus,
      status: completed.status!,
    };

    try {
      await this.fcmService.sendPushNotification(notificationDto);
    } catch (error) {
      this.logger.error(`Error sending notification ${error}`);
      throw error;
    }

    return completed;
  }

  async fetchServiceRequests(
    userId: number,
    page = 1,
    limit = 10,
    search?: string,
    status?: ServiceRequestStatus,
    dateFrom?: Date,
    dateTo?: Date,
    minAmount?: number,
    maxAmount?: number,
    paymentStatus?: PaymentStatus,
  ) {
    const user = await this.userService.findById(userId);

    // Check if user is admin
    if (user?.role !== UserRole.admin && user?.role !== UserRole.superadmin) {
      throw new BadRequestException(
        'Only admins can access all service requests',
      );
    }

    const skip = (page - 1) * limit;

    // Build the where clause
    const where: Prisma.ServiceRequestWhereInput = {};

    // Search filter
    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { customerFullAddress: { contains: search, mode: 'insensitive' } },
        { serviceDetails: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          manong: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        { serviceItem: { title: { contains: search, mode: 'insensitive' } } },
        {
          subServiceItem: { title: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.total = {};
      if (minAmount !== undefined) {
        where.total.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.total.lte = maxAmount;
      }
    }

    // Get total count for pagination
    const totalCount = await this.prisma.serviceRequest.count({ where });

    // Fetch service requests with all related data
    const requests = await this.prisma.serviceRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            status: true,
            role: true,
            profilePhoto: true,
          },
        },
        manong: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            status: true,
            role: true,
            profilePhoto: true,
            manongProfile: true,
          },
        },
        serviceItem: true,
        subServiceItem: true,
        urgencyLevel: true,
        paymentMethod: true,
        paymentTransactions: {
          include: {
            refundRequest: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        refundRequests: true,
        feedback: true,
        manongReport: true,
        adjustments: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Parse imagesPath if it's a JSON string
    const formattedRequests = requests.map((request) => ({
      ...request,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      imagesPath:
        request.imagesPath && typeof request.imagesPath === 'string'
          ? JSON.parse(request.imagesPath)
          : request.imagesPath || [],
    }));

    return {
      data: formattedRequests,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      limit,
    };
  }

  async fetchServiceRequestStats() {
    // Get total counts
    const [
      total,
      awaitingAcceptance,
      pending,
      accepted,
      inProgress,
      completed,
      cancelled,
      failed,
      refunding,
      expired,
      rejected,
    ] = await Promise.all([
      this.prisma.serviceRequest.count(),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.awaitingAcceptance },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.pending },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.accepted },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.inProgress },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.completed },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.cancelled },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.failed },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.refunding },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.expired },
      }),
      this.prisma.serviceRequest.count({
        where: { status: ServiceRequestStatus.rejected },
      }),
    ]);

    // Calculate total revenue from completed requests
    const completedRequests = await this.prisma.serviceRequest.findMany({
      where: {
        status: ServiceRequestStatus.completed,
        total: { not: null },
      },
      select: { total: true },
    });

    const totalRevenue = completedRequests.reduce((sum, req) => {
      return sum + (req.total?.toNumber() || 0);
    }, 0);

    // Calculate average completion time
    const completedWithTimes = await this.prisma.serviceRequest.findMany({
      where: {
        status: ServiceRequestStatus.completed,
        createdAt: { not: undefined },
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
    });

    let averageCompletionTime = 0;
    if (completedWithTimes.length > 0) {
      const totalTime = completedWithTimes.reduce((sum, req) => {
        const start = new Date(req.createdAt).getTime();
        const end = new Date(req.completedAt!).getTime();
        return sum + (end - start);
      }, 0);
      averageCompletionTime = Math.round(
        totalTime / completedWithTimes.length / 60000,
      ); // Convert to minutes
    }

    return {
      total,
      awaitingAcceptance,
      pending,
      accepted,
      inProgress,
      completed,
      cancelled,
      failed,
      refunding,
      expired,
      rejected,
      totalRevenue,
      averageCompletionTime,
    };
  }

  async deleteServiceRequest(id: number) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Service request with id ${id} not found`);
    }

    // Check if there are any active payment transactions or refunds
    const hasActiveTransactions =
      await this.prisma.paymentTransaction.findFirst({
        where: {
          serviceRequestId: id,
          status: { in: [PaymentStatus.pending, PaymentStatus.paid] },
        },
      });

    const hasPendingRefunds = await this.prisma.refundRequest.findFirst({
      where: {
        serviceRequestId: id,
        status: { in: ['pending', 'approved', 'processing'] },
      },
    });

    if (hasActiveTransactions || hasPendingRefunds) {
      throw new BadRequestException(
        'Cannot delete service request with active payments or pending refunds',
      );
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: ServiceRequestStatus.cancelled,
      },
    });
  }

  async bulkDeleteServiceRequests(ids: number[]) {
    // Check all requests exist and can be deleted
    const requests = await this.prisma.serviceRequest.findMany({
      where: { id: { in: ids } },
      include: {
        paymentTransactions: {
          where: {
            status: { in: [PaymentStatus.pending, PaymentStatus.paid] },
          },
        },
        refundRequests: {
          where: {
            status: { in: ['pending', 'approved', 'processing'] },
          },
        },
      },
    });

    if (requests.length !== ids.length) {
      throw new NotFoundException('Some service requests were not found');
    }

    const cannotDelete = requests.filter(
      (req) =>
        req.paymentTransactions.length > 0 || req.refundRequests.length > 0,
    );

    if (cannotDelete.length > 0) {
      const requestNumbers = cannotDelete
        .map((req) => req.requestNumber)
        .join(', ');
      throw new BadRequestException(
        `Cannot delete service requests with active payments or pending refunds: ${requestNumbers}`,
      );
    }

    // Soft delete all requests
    return this.prisma.serviceRequest.updateMany({
      where: { id: { in: ids } },
      data: {
        deletedAt: new Date(),
        status: ServiceRequestStatus.cancelled,
      },
    });
  }

  async updateServiceRequestAdmin(id: number, dto: UpdateServiceRequestDto) {
    const request = await this.findOrFail(id);

    if (!request) {
      throw new NotFoundException(`ServiceRequest with id ${id} not found`);
    }

    const updateData: any = {
      status: dto.status,
      paymentStatus: dto.paymentStatus,
      notes: dto.notes,
    };

    // Only update manong if provided
    if (dto.manongId) {
      const manong = await this.userService.findById(dto.manongId);
      if (!manong || manong.role !== UserRole.manong) {
        throw new BadRequestException(
          'Manong ID must belong to a valid manong user',
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.manongId = dto.manongId;
    }

    // Only update total if provided
    if (dto.total !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.total = dto.total;
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
      include: {
        user: true,
        manong: true,
        serviceItem: true,
        subServiceItem: true,
        paymentTransactions: true,
      },
    });

    return updated;
  }
}
