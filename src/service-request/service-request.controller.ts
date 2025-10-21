import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceRequestService } from './service-request.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { GoogleGeocodingService } from 'src/google-geocoding/google-geocoding.service';
import { CompleteServiceRequestDto } from './dto/complete-service-request.dto';
import { PaymentStatus } from '@prisma/client';

@Controller('api/service-requests')
export class ServiceRequestController {
  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private readonly googleGeocodingService: GoogleGeocodingService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 3))
  async store(
    @CurrentUserId() userId: number,
    @Body() dto: CreateServiceRequestDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    const formattedAddress =
      await this.googleGeocodingService.getFormattedAddress(
        dto.customerLat!,
        dto.customerLng!,
      );

    dto.images = images;
    dto.customerFullAddress = formattedAddress;
    const { created, warning, duplicate } =
      await this.serviceRequestService.createServiceRequest(userId, dto);

    const response: any = { success: true, data: created };
    if (warning) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.warning = warning;
    }
    if (duplicate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.duplicate = duplicate;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { success: true, data: response };
  }

  @UseGuards(JwtAuthGuard)
  @Get('ongoing')
  async hasOngoingServiceRequest(@CurrentUserId() userId: number) {
    const result =
      await this.serviceRequestService.getOngoingServiceRequest(userId);

    return {
      success: true,
      data: result.data,
      message:
        result.isManong != false
          ? 'Proceed to the client’s location.'
          : 'Your Manong is on the way!',
      isManong: result.isManong,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceRequestDto,
  ) {
    const data = await this.serviceRequestService.updateServiceRequest(id, dto);

    return {
      success: true,
      data: data,
      message: 'Updated successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(
    @CurrentUserId() userId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const requests =
      await this.serviceRequestService.fetchServiceRequestsByUserId(
        userId,
        parseInt(page),
        parseInt(limit),
      );

    return { success: true, data: requests.data, isManong: requests.isManong };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async show(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    const request = await this.serviceRequestService.showServiceRequest(
      id,
      userId,
    );

    return { success: true, data: request };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  async completeRequest(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
    @Body() dto: CompleteServiceRequestDto,
  ) {
    const result = await this.serviceRequestService.completeServiceRequest(
      id,
      userId,
      dto,
    );

    let message = 'We couldn’t process your payment. Please try again later.';

    if (result) {
      switch (result.paymentStatus) {
        case PaymentStatus.paid:
          message =
            'Your payment was successful! A service provider will be on the way shortly.';
          break;
        case PaymentStatus.pending:
          message =
            'Your payment is pending. We’ll update you once it’s confirmed and assign a provider.';
          break;
        case PaymentStatus.failed:
          message =
            'Payment failed. Please try again or use a different payment method.';
          break;
        case PaymentStatus.refunded:
          message =
            'Your payment has been refunded. Please check your account.';
          break;
        case PaymentStatus.unpaid:
        default:
          return `Payment status: ${status}`;
      }
    }

    return {
      success: true,
      data: result,
      message,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  async acceptServiceRequest(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.serviceRequestService.acceptServiceRequest(
      userId,
      id,
    );

    return {
      success: true,
      data: result,
      message:
        result != null
          ? 'Service Request has been accepted!'
          : 'Failed to accept Service Request',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  async startServiceRequest(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.serviceRequestService.startServiceRequest(
      userId,
      id,
    );

    return {
      success: true,
      data: result,
      message:
        result != null
          ? 'Service Request started!'
          : 'Failed to start Service Request',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelServiceRequest(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.serviceRequestService.cancelServiceRequest(
      userId,
      id,
    );

    return {
      success: true,
      data: result,
      message: 'The service request has been cancelled.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/expired')
  async expiredServiceRequest(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.serviceRequestService.expiredServiceRequest(
      userId,
      id,
    );

    return {
      success: true,
      data: result,
      message: 'The service request has already expired.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/mark-completed')
  async markServiceRequestCompleted(@Param('id', ParseIntPipe) id: number) {
    const result =
      await this.serviceRequestService.markServiceRequestCompleted(id);

    return {
      success: true,
      data: result,
      message: 'Service request mark as completed.',
    };
  }
}
