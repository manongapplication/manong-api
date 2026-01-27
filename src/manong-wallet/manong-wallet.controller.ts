import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';
import { AppMaintenanceGuard } from 'src/common/guards/app-maintenance.guard';
import { ManongWalletService } from './manong-wallet.service';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { CreateManongWalletDto } from './dto/create-manong-wallet.dto';
import { CreateCashInManongWallet } from './dto/create-cash-in-manong-wallet.dto';

@UseGuards(JwtAuthGuard, AppMaintenanceGuard)
@Controller('api/manong-wallet')
export class ManongWalletController {
  constructor(private readonly manongWalletService: ManongWalletService) {}

  @Get()
  async fetchWallet(@CurrentUserId() manongId: number) {
    const result = await this.manongWalletService.fetchManongWallet(manongId);

    return {
      success: true,
      data: result,
      message: 'Manong Wallet successfully fetched.',
    };
  }

  @Post()
  async createWallet(
    @CurrentUserId() manongId: number,
    dto: CreateManongWalletDto,
  ) {
    const result = await this.manongWalletService.createManongWallet(
      manongId,
      dto,
    );

    return {
      success: true,
      data: result,
      message:
        'Your ManongWallet has been created, but it currently has a zero balance. To start taking requests, you must add funds to your wallet first. Once funded, you can accept bookings and receive payments.',
    };
  }

  @Post('/cash-in')
  async cashIn(
    @CurrentUserId() manongId: number,
    dto: CreateCashInManongWallet,
  ) {
    const result = await this.manongWalletService.cashInWallet(manongId, dto);

    return {
      success: true,
      data: result,
      message: 'Successfully cashed in!',
    };
  }
}
