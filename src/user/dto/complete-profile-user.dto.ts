import { AddressCategory } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

enum ValidIdType {
  selfie,
  id,
}

export class CompleteProfileUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nickname?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(AddressCategory, {
    message: 'addressCategory must be a valid category',
  })
  addressCategory: AddressCategory;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  addressLine: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(ValidIdType, { message: 'validIdType must be a valid type' })
  validIdType: string;

  @IsOptional()
  validId: Express.Multer.File;

  @IsNotEmpty()
  @IsString()
  password: string;
}
