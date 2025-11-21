import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PaymentTransactionService } from './payment-transaction.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/payment-transaction')
export class PaymentTransactionController {
  constructor(
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  @Get()
  async fetchTransactions(
    @CurrentUserId() userId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result =
      await this.paymentTransactionService.fetchPaymentTransactions(
        userId,
        parseInt(page),
        parseInt(limit),
      );

    return {
      success: true,
      data: result,
      message: 'Payment transactions fetched successfully!',
    };
  }

  @Get('user/unseen-count')
  async countUnseenPaymentTransactionsByUserId(
    @CurrentUserId() userId: number,
  ) {
    const result =
      await this.paymentTransactionService.countUnseenPaymentTransactionsByUserId(
        userId,
      );

    return {
      success: true,
      data: result,
      message: 'Payment Transaction successfully counted!',
    };
  }

  @Get('user/count')
  async countPaymentTransactionsByUserId(@CurrentUserId() userId: number) {
    const result =
      await this.paymentTransactionService.countPaymentTransactionsByUserId(
        userId,
      );

    return {
      success: true,
      data: result,
      message: 'Payment Transaction successfully counted!',
    };
  }

  @Get('user/seenAll')
  async seenAllPaymentTransactionsByUserId(@CurrentUserId() userId: number) {
    await this.paymentTransactionService.seenAllPaymentTransactionsByUserId(
      userId,
    );
    return {
      success: true,
      message: 'Payment Transaction successfully seen!',
    };
  }
}
