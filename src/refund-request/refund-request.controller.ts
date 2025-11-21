import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { RefundRequestService } from './refund-request.service';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { UpdateRefundRequestDto } from './dto/update-refund-request.dto';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/refund-request')
export class RefundRequestController {
  constructor(private readonly refundRequestService: RefundRequestService) {}

  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() dto: CreateRefundRequestDto,
  ) {
    const result = await this.refundRequestService.createRefundRequest(
      userId,
      dto,
    );

    return {
      success: true,
      data: result?.data,
      message:
        result?.message ??
        "Refund request submitted successfully! Please wait for admin review. We'll notify you once it is processed.",
    };
  }

  @Post('get')
  async fetchById(
    @CurrentUserId() userId: number,
    @Body('serviceRequestId') serviceRequestId: number,
  ) {
    const result = await this.refundRequestService.fetchRefundRequestById(
      userId,
      serviceRequestId,
    );

    return {
      success: true,
      data: result,
      message: 'Fetched refund requests.',
    };
  }

  @Get('all')
  async fetchAll(@CurrentUserId() userId: number) {
    const result = await this.refundRequestService.fetchRefunds(userId);

    return {
      success: true,
      data: result,
      message: 'Refund requests fetched!',
    };
  }

  @Put(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRefundRequestDto,
  ) {
    const result = await this.refundRequestService.updateRefundRequest(
      userId,
      id,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Refund request updated successfully!',
    };
  }

  @Post('process-pending')
  async processPendingRefunds(@CurrentUserId() userId: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result =
      await this.refundRequestService.processPendingRefunds(userId);

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: result,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      message: `Processed ${result.length} pending refund requests.`,
    };
  }
}
