import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { ManongWalletTransactionService } from './manong-wallet-transaction.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { UpdateManongWalletTransactionDto } from './dto/update-manong-wallet-transaction.dto';
import { PayJobFeesDto } from './dto/pay-job-fees.dto';
import { JobFeesPaymentStatusDto } from './dto/job-fees-payment-statuts.dto';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/manong-wallet-transaction')
export class ManongWalletTransactionController {
  constructor(
    private readonly manongWalletTransactionService: ManongWalletTransactionService,
  ) {}

  @Get(':id')
  async fetchWalletTransactionById(@Param('id', ParseIntPipe) id: number) {
    const result = await this.manongWalletTransactionService.findById(id);

    return {
      success: true,
      data: result,
      message: 'Successfully fetch the Wallet Transaction',
    };
  }

  @Get(':id/details')
  async findByIdWithDetails(
    @Param('id') id: number,
    @CurrentUserId() userId: number,
  ) {
    const transaction =
      await this.manongWalletTransactionService.findByIdIncludesWallet(id);

    // Check if user has permission to view this transaction
    if (transaction?.wallet.manongId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this transaction',
      );
    }

    return {
      success: true,
      data: transaction,
    };
  }

  @Post('all/:walletId')
  async fetchAllByWalletId(
    @Param('walletId', ParseIntPipe) walletId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result =
      await this.manongWalletTransactionService.fetchWalletTransactionsByWalletId(
        walletId,
        parseInt(page),
        parseInt(limit),
      );

    return {
      success: true,
      data: result.transactions, // Changed from just result
      pagination: {
        page: result.page,
        limit: result.limit,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
      },
      message: 'Successfully fetched all Wallet Transactions',
    };
  }

  @Get('list/all')
  async fetchPayouts(@CurrentUserId() userId: number) {
    const result =
      await this.manongWalletTransactionService.fetchPayouts(userId);

    return {
      success: true,
      data: result,
      message: 'Successfully fetched all Wallet Transactions',
    };
  }

  @Put(':id')
  async updateWalletTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManongWalletTransactionDto,
  ) {
    const result =
      await this.manongWalletTransactionService.updateWalletTransactionById(
        id,
        dto,
      );

    return {
      success: true,
      data: result,
      message: 'Successfully updated wallet transaction',
    };
  }

  @Post(':id/complete-payout')
  async completePayoutById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    const result = await this.manongWalletTransactionService.completePayoutById(
      userId,
      id,
    );

    return {
      success: true,
      data: result,
      message: 'Successfully completed payout!',
    };
  }

  @Post(':id/failed-payout')
  async markPayoutAsFailed(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ) {
    const result = await this.manongWalletTransactionService.markPayoutAsFailed(
      userId,
      id,
    );

    return {
      success: true,
      data: result,
      message: 'Successfully marked payout as failed!',
    };
  }

  @Get('pending-job-fee/:walletId')
  async pendingJobFee(@Param('walletId', ParseIntPipe) walletId: number) {
    const result =
      await this.manongWalletTransactionService.fetchAllPendingJobFee(walletId);

    return {
      success: true,
      data: result,
      message: 'Successfully fetched pending job fees',
    };
  }

  @Post('pay-pending-job-fees/:walletId')
  async payPendingJobFees(
    @Param('walletId', ParseIntPipe) walletId: number,
    @Body() dto: PayJobFeesDto,
  ) {
    const result = await this.manongWalletTransactionService.payPendingJobFees(
      walletId,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Pay pending job fees successfully',
    };
  }

  @Post('job-fees/payment-status')
  async jobFeesPaymentStatus(@Body() dto: JobFeesPaymentStatusDto) {
    const result =
      await this.manongWalletTransactionService.getJobFeesPaymentStatus(
        dto.ids,
      );
    return result;
  }
}
