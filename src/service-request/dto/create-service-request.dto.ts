import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class CreateServiceRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('user', 'id', {
    message: 'manongId must reference an existing user',
  })
  manongId?: number | null;

  @Type(() => Number)
  @IsInt()
  @Exists('serviceItem', 'id', {
    message: 'serviceItemId must reference an existing serviceItem',
  })
  serviceItemId: number;

  @ValidateIf((o) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const val = o.subServiceItemId;
    return val !== null && val !== undefined && val !== 'null';
  })
  @Type(() => Number)
  @IsInt()
  @Exists('subServiceItem', 'id', {
    message: 'subServiceItemId must reference an existing subServiceItem',
  })
  subServiceItemId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Exists('paymentMethod', 'id', {
    message: 'paymentMethodId must reference an existing paymentMethod',
  })
  paymentMethodId?: number;

  @Type(() => Number)
  @IsInt()
  @Exists('urgencyLevel', 'id', {
    message: 'urgencyLevelId must reference an existing urgencyLevel',
  })
  urgencyLevelId: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  otherServiceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceDetails?: string;

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
  @IsString()
  @IsIn(['pending', 'accepted', 'completed', 'cancelled', 'expired'])
  status?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentTransactionId?: string;
}
