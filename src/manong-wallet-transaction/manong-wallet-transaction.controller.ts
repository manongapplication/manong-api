import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { ManongWalletTransactionService } from './manong-wallet-transaction.service';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/manong-wallet-transaction')
export class ManongWalletTransactionController {
  constructor(
    private readonly manongWalletTransactionService: ManongWalletTransactionService,
  ) {}

  @Post(':id')
  async fetchWalletTransactionById(@Param('id', ParseIntPipe) id: number) {
    const result =
      await this.manongWalletTransactionService.fetchWalletTransactionById(id);

    return {
      success: true,
      data: result,
      message: 'Successfully fetch the Wallet Transaction',
    };
  }

  @Post('all/:walletId')
  async fetchAllByWalletId(@Param('walletId', ParseIntPipe) walletId: number) {
    const result =
      await this.manongWalletTransactionService.fetchWalletTransactionsByWalletId(
        walletId,
      );

    return {
      success: true,
      data: result,
      message: 'Successfully fetched all Wallet Transactions',
    };
  }
}
