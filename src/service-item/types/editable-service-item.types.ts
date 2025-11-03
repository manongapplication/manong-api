import { ServiceItemStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EditableSubServiceItem } from './editable-sub-service-item.types';

export class EditableServiceItem {
  @IsOptional()
  @Type(() => Number)
  id?: number;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString(
    {},
    { message: 'priceMin must be a number or numeric string' },
  )
  priceMin?: string | number;

  @IsOptional()
  @IsNumberString(
    {},
    { message: 'priceMax must be a number or numeric string' },
  )
  priceMax?: string | number;

  @IsOptional()
  @IsNumberString(
    {},
    { message: 'ratePerKm must be a number or numeric string' },
  )
  ratePerKm?: string | number;

  @IsOptional()
  @IsString()
  iconName?: string;

  @IsOptional()
  @IsString()
  iconColor?: string;

  @IsOptional()
  iconTextColor?: string;

  @IsOptional()
  @IsEnum(ServiceItemStatus, { message: 'Unknown service item status' })
  status?: ServiceItemStatus;

  @IsOptional()
  @IsBoolean()
  markAsDelete?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditableSubServiceItem)
  subServices?: EditableSubServiceItem[];
}
