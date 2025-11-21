import { PaymentStatus, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreatePaymentTransactionDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Exists('serviceRequest', 'id', { message: 'serviceRequestId not found.' })
  serviceRequestId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Exists('user', 'id', { message: 'userId not found.' })
  userId: number;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  paymentIntentId?: string | null | undefined;

  @IsOptional()
  @IsString()
  paymentIdOnGateway?: string | null | undefined;

  @IsOptional()
  @IsString()
  refundIdOnGateway?: string | null | undefined;

  @IsOptional()
  @IsBoolean()
  handledManually?: boolean;

  @IsNotEmpty()
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

  @IsOptional()
  @IsString()
  metadata?: string | null | undefined;
}
