import { PaymentStatus, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class UpdatePaymentTransactionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('serviceRequest', 'id', { message: 'serviceRequestId not found.' })
  serviceRequestId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('user', 'id', { message: 'userId not found.' })
  userId: number;

  @IsOptional()
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @IsOptional()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'paymentStatus not found.' })
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(TransactionType, { message: 'type not found.' })
  type?: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;
}
