import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';
import { RefundStatus } from '@prisma/client';

export class UpdateRefundRequestDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('serviceRequest', 'id', { message: 'serviceRequest not found.' })
  serviceRequestId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('paymentTransaction', 'id', {
    message: 'paymentTransaction not found.',
  })
  paymentTransactionId?: number;

  @IsOptional()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @IsOptional()
  @IsBoolean()
  handledManually?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', { message: 'User not found.' })
  reviewedBy?: number;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;
}
