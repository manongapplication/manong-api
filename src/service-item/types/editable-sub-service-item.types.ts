import { ServiceItemStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class EditableSubServiceItem {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  title: string;

  @IsOptional()
  description?: string;

  @IsNumberString(
    {},
    { message: 'priceMin must be a number or numeric string' },
  )
  cost?: string | number;

  @IsOptional()
  @IsNumberString(
    {},
    { message: 'priceMax must be a number or numeric string' },
  )
  fee?: string | number;

  @IsOptional()
  @IsString()
  iconName?: string;

  @IsOptional()
  @IsString()
  iconTextColor?: string;

  @IsOptional()
  @IsEnum(ServiceItemStatus, { message: 'Unknown service item status' })
  status?: ServiceItemStatus;

  @IsOptional()
  @IsBoolean()
  markAsDelete?: boolean;
}
