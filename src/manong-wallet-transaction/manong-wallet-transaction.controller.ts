import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { ManongWalletTransactionService } from './manong-wallet-transaction.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';

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
}
