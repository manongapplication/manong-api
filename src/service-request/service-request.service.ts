import {
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
import { PaymentStatus } from '@prisma/client';
import { CalculationUtil } from 'src/common/utils/calculation.util';
import { UserPaymentMethodService } from 'src/user-payment-method/user-payment-method.service';
import { PaymongoService } from 'src/paymongo/paymongo.service';
import { UpdateDataServiceRequestDto } from './dto/update-data-service-request.dto';
import axios from 'axios';
import { PaymongoError } from 'src/paymongo/types/paymongo-error.types';
import { CreatePaymentIntentDto } from 'src/paymongo/dto/create-payment-intent.dto';
import { CompleteServiceRequestDto } from './dto/complete-service-request.dto';
import { CompleteServiceRequest } from './types/service-request.types';
import { mapPaymongoStatus } from 'src/common/utils/payment.util';
import { UserService } from 'src/user/user.service';
import { FcmService } from 'src/fcm/fcm.service';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';

@Injectable()
export class ServiceRequestService {
  private readonly logger = new Logger(ServiceRequestService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly userPaymentMethodService: UserPaymentMethodService,
    private readonly paymongService: PaymongoService,
    private readonly userService: UserService,
    private readonly fcmService: FcmService,
  ) {}

  async findById(id: number) {
    return this.prisma.serviceRequest.findUnique({ where: { id } });
  }

  async findOrFail(id: number) {
    try {
      return await this.prisma.serviceRequest.findUniqueOrThrow({
        where: { id },
      });
    } catch {
      throw new NotFoundException(`Servcice with id ${id} not found`);
    }
  }

  async createServiceRequest(userId: number, dto: CreateServiceRequestDto) {
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

    // Create the service request
    const created = await this.prisma.serviceRequest.create({
      data: {
        userId,
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
        status: dto.status ?? 'pending',
      },
    });

    return { created, warning: null, duplicate: false };
  }

  async fetchServiceRequestsByUserId(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const user = await this.userService.findById(userId);

    let where = {};

    if (user?.role == 'manong') {
      where = { manongId: userId };
    } else {
      where = { userId };
    }

    const admin = user?.role == 'manong';

    const requests = await this.prisma.serviceRequest.findMany({
      where: where,
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
        paymentMethod: true,
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
      admin: admin,
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
        paymentTransactionId: dto.paymentTransactionId,
        paymentRedirectUrl: dto.paymentRedirectUrl,
        paymentStatus: dto.paymentStatus,
        deletedAt: dto.deletedAt,
        arrivedAt: dto.arrivedAt,
      },
    });

    return updated;
  }

  async showServiceRequest(id: number, userId: number) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, userId },
      include: {
        user: true,
        manong: true,
        serviceItem: true,
        subServiceItem: true,
        urgencyLevel: true,
        paymentMethod: true,
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
    subServiceItemTitle: string,
    serviceRequestId: number,
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

      const result = await this.paymongService.createPayment(
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
      updateData.paymentTransactionId = result.data.id;
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
            exists.subServiceItem.title,
            exists.id,
          );
        }

        break;
      case 'gcash':
        {
          await this.updateServiceRequestData(
            userId,
            updateData,
            dto,
            exists.subServiceItem.title,
            exists.id,
          );
          this.logger.debug('Gcash payment!');
        }
        break;

      default:
        updateData.paymentStatus = PaymentStatus.failed;
        updateData.status = 'failed';
        break;
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      include: {
        manong: true,
        user: true,
        serviceItem: true,
        subServiceItem: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData as any,
    });

    const notificationDto: CreateNotificationDto = {
      token: updated.manong?.fcmToken ?? '',
      title: `You've got a ${updated?.serviceItem?.title ?? 'service'} request!`,
      body: `A customer has requested your ${updated?.subServiceItem.title} service. Please check the app for details.`,
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

    return updated;
  }

  async acceptServiceRequest(userId: number, id: number) {
    const user = await this.userService.findById(userId);

    if (user?.role != 'manong' && user?.role != 'admin') {
      throw new Error('Not authorized to start the request.');
    }

    const result = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'accepted',
      },
    });

    return result;
  }

  async startServiceRequest(userId: number, id: number) {
    const user = await this.userService.findById(userId);

    if (user?.role != 'manong' && user?.role != 'admin') {
      throw new Error('Not authorized to start the request.');
    }

    const ongoing = await this.prisma.serviceRequest.findFirst({
      where: { manongId: userId, status: 'inprogress' },
    });

    if (ongoing) {
      throw new Error('You already have an ongoing request.');
    }

    const result = this.prisma.serviceRequest.update({
      where: {
        id,
      },
      data: {
        status: 'inprogress',
      },
    });

    return result;
  }

  async getOngoingServiceRequest(userId: number) {
    const user = await this.userService.findById(userId);

    let where = {};

    if (user?.role == 'manong') {
      where = { manongId: userId };
    } else {
      where = { userId };
    }

    const admin = user?.role == 'manong';

    const ongoing = await this.prisma.serviceRequest.findFirst({
      where: { ...where, status: 'inprogress' },
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
      },
    });

    return {
      data: ongoing,
      admin: admin,
    };
  }

  async getStatusById(id: number) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });
    return request?.status;
  }

  async cancelServiceRequest(userId: number, id: number) {
    const data = await this.prisma.serviceRequest.findUnique({
      where: {
        id,
      },
    });

    let status = '';

    if (data?.paymentStatus == PaymentStatus.paid) {
      status = 'refunding';
    } else {
      status = 'cancelled';
    }

    const updated = await this.prisma.serviceRequest.update({
      where: {
        id,
        userId,
      },
      data: {
        status: status,
        deletedAt: new Date(),
      },
    });

    return updated;
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
        data = { status: 'refunding' };
      } else {
        data = {
          status: 'expired',
          deletedAt: new Date(),
        };
      }
    } else if (exists.status == 'inprogress') {
      data = { status: 'completed' };
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: exists.id },
      data,
    });

    this.logger.debug(`Service now expired ${JSON.stringify(updated)}`);

    return updated;
  }
}
