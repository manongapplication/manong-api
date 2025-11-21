import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateRefundRequestDto {
  @IsNotEmpty()
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

  @IsNotEmpty()
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
}
