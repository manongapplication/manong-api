import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { AssistantDto } from './assistant.dto';
import { AccountStatus } from '@prisma/client';
export class UpdateManongDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  lastName?: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(10, 15)
  phone?: string;

  @IsArray()
  @IsOptional()
  @Type(() => Number)
  serviceItems?: number[];

  @IsArray()
  @IsOptional()
  @Type(() => Number)
  subServiceItems?: number[];

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  experienceDescription?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  skillImage?: Express.Multer.File[];

  @IsOptional()
  nbiImage?: Express.Multer.File[];

  @IsOptional()
  govIdImage?: Express.Multer.File[];

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @Type(() => Number)
  maxDailyServices?: number;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  confirmPassword?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  yearsExperience?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Type(() => AssistantDto)
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  assistants?: AssistantDto[];

  @IsOptional()
  @IsString()
  @IsEnum(AccountStatus, { message: 'status is invalid.' })
  status?: AccountStatus;

  @IsArray()
  @IsNumber({}, { each: true })
  subServiceItemIds: number[];
}
