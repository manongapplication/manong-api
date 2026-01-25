import { WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateManongWalletTransactionDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @Exists('manongWallet', 'id', { message: 'Manong Wallet not found.' })
  walletId: number;

  @IsNotEmpty()
  @IsEnum(WalletTransactionType, {
    message: 'Wallet Transaction Type not found.',
  })
  type: WalletTransactionType;

  @IsNotEmpty()
  @IsEnum(WalletTransactionStatus, {
    message: 'Wallet Transaction Status not found.',
  })
  status: WalletTransactionStatus;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

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
