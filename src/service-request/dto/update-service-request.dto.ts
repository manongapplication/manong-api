import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';
import { Type } from 'class-transformer';
import { PaymentStatus, ServiceRequestStatus } from '@prisma/client';

export class UpdateServiceRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('user', 'id', {
    message: 'manongId must reference an existing user',
  })
  manongId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('serviceItem', 'id', {
    message: 'serviceItemId must reference an existing serviceItem',
  })
  serviceItemId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('subServiceItem', 'id')
  subServiceItemId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('paymentMethod', 'id', {
    message: 'paymentMethodId must reference an existing paymentMethod',
  })
  paymentMethodId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  otherServiceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceDetails?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('urgencyLevel', 'id')
  urgencyLevelId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  images?: Express.Multer.File[];

  @IsOptional()
  @IsString()
  customerFullAddress?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  customerLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  customerLng?: number;

  @IsOptional()
  @IsEnum(ServiceRequestStatus, { message: 'status enum is not valid' })
  status?: ServiceRequestStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentTransactionId?: string;

  @IsOptional()
  @IsString()
  paymentRedirectUrl?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  arrivedAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deletedAt?: string;

  @IsOptional()
  @IsString()
  paymentIdOnGateway?: string;

  @IsOptional()
  @IsString()
  refundIdOnGateway?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  total?: number;
}
