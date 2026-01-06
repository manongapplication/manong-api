import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { PaymentStatus, ServiceRequestStatus, UserRole } from '@prisma/client';
import { getFormattedAddressOSM } from 'src/common/utils/address.util';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { ApiQuery } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/service-requests')
export class ServiceRequestController {
  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private readonly googleGeocodingService: GoogleGeocodingService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 3))
  async store(
    @CurrentUserId() userId: number,
    @Body() dto: CreateServiceRequestDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    // const formattedAddress =
    //   await this.googleGeocodingService.getFormattedAddress(
    //     dto.customerLat!,
    //     dto.customerLng!,
    //   );

    const formattedAddress = await getFormattedAddressOSM(
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

  @Get()
  async index(
    @CurrentUserId() userId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: string,
  ) {
    let statusEnum: ServiceRequestStatus | undefined;

    if (status) {
      // Check if the string is a valid enum value
      if (
        Object.values(ServiceRequestStatus).includes(
          status as ServiceRequestStatus,
        )
      ) {
        statusEnum = status as ServiceRequestStatus;
      } else {
        throw new BadRequestException(`Invalid status: ${status}`);
      }
    }

    const requests =
      await this.serviceRequestService.fetchServiceRequestsByUserId(
        userId,
        parseInt(page),
        parseInt(limit),
        statusEnum,
      );

    return { success: true, data: requests.data, isManong: requests.isManong };
  }

  @Get('user/:id')
  async userShow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    const request = await this.serviceRequestService.showUserServiceRequest(
      id,
      userId,
    );

    return { success: true, data: request };
  }

  @Get(':id')
  async show(@Param('id', ParseIntPipe) id: number) {
    const request = await this.serviceRequestService.showServiceRequest(id);

    return { success: true, data: request };
  }

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

  // @Post(':id/cancel')
  // async cancelServiceRequest(
  //   @CurrentUserId() userId: number,
  //   @Param('id', ParseIntPipe) id: number,
  // ) {
  //   const result = await this.serviceRequestService.cancelServiceRequest(
  //     userId,
  //     id,
  //   );

  //   return {
  //     success: true,
  //     data: result,
  //     message: 'The service request has been cancelled.',
  //   };
  // }

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

  @Post(':id/mark-completed')
  async markServiceRequestCompleted(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    const result = await this.serviceRequestService.markServiceRequestCompleted(
      id,
      userId,
    );

    return {
      success: true,
      data: result,
      message: 'Service request mark as completed.',
    };
  }

  @Post(':id/mark-paid')
  @UseGuards(JwtAuthGuard)
  async markServiceAsPaid(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.serviceRequestService.markServiceAsPaid(
      userId,
      id,
    );

    return {
      success: true,
      data: result,
      message: 'Service marked as paid successfully',
    };
  }

  @Get('admin/all')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ServiceRequestStatus })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'dateFrom', required: false, type: Date })
  @ApiQuery({ name: 'dateTo', required: false, type: Date })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  async getAllServiceRequests(
    @CurrentUserId() userId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: ServiceRequestStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
  ) {
    const result = await this.serviceRequestService.fetchServiceRequests(
      userId,
      parseInt(page),
      parseInt(limit),
      search,
      status,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      minAmount ? parseFloat(minAmount) : undefined,
      maxAmount ? parseFloat(maxAmount) : undefined,
      paymentStatus,
    );

    return {
      success: true,
      data: result.data,
      pagination: {
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        limit: result.limit,
      },
    };
  }

  @Get('admin/stats')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getServiceRequestStats(@CurrentUserId() userId: number) {
    const stats = await this.serviceRequestService.fetchServiceRequestStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Delete(':id')
  async deleteServiceRequest(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user =
      await this.serviceRequestService['userService'].findById(userId);

    // Only admins can delete
    if (user?.role !== UserRole.admin && user?.role !== UserRole.superadmin) {
      throw new BadRequestException('Only admins can delete service requests');
    }

    const result = await this.serviceRequestService.deleteServiceRequest(id);

    return {
      success: true,
      data: result,
      message: 'Service request deleted successfully',
    };
  }

  @Post('bulk-delete')
  async bulkDeleteServiceRequests(
    @CurrentUserId() userId: number,
    @Body() body: { ids: number[] },
  ) {
    const user =
      await this.serviceRequestService['userService'].findById(userId);

    // Only admins can delete
    if (user?.role !== UserRole.admin && user?.role !== UserRole.superadmin) {
      throw new BadRequestException('Only admins can delete service requests');
    }

    if (!body.ids || body.ids.length === 0) {
      throw new BadRequestException('No service request IDs provided');
    }

    const result = await this.serviceRequestService.bulkDeleteServiceRequests(
      body.ids,
    );

    return {
      success: true,
      data: result,
      message: `${result.count} service request(s) deleted successfully`,
    };
  }

  @Put('admin/:id')
  async updateServiceRequestAdmin(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceRequestDto,
  ) {
    const user =
      await this.serviceRequestService['userService'].findById(userId);

    // Only admins can update
    if (user?.role !== UserRole.admin && user?.role !== UserRole.superadmin) {
      throw new BadRequestException('Only admins can update service requests');
    }

    const result = await this.serviceRequestService.updateServiceRequestAdmin(
      id,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Service request updated successfully',
    };
  }
}
