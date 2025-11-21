import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateManongReportDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @Exists('serviceRequest', 'id', { message: 'serviceRequest not found.' })
  serviceRequestId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', { message: 'Manong not found.' })
  manongId: number;

  @IsNotEmpty()
  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  materialsUsed?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  laborDuration?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  images?: Express.Multer.File[];

  @IsOptional()
  @IsString()
  issuesFound?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  customerPresent?: boolean;

  @IsOptional()
  @IsBoolean()
  verfiedByUser?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalCost?: number;

  @IsOptional()
  @IsString()
  warrantyInfo?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  servicePaid?: boolean;
}
