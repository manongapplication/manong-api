import { WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class UpdateManongWalletTransactionDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('manongWallet', 'id', { message: 'Manong Wallet not found.' })
  walletId?: number;

  @IsOptional()
  @IsEnum(WalletTransactionType, {
    message: 'Wallet Transaction Type not found.',
  })
  type?: WalletTransactionType;

  @IsOptional()
  @IsEnum(WalletTransactionStatus, {
    message: 'Wallet Transaction Status not found.',
  })
  status?: WalletTransactionStatus;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}
