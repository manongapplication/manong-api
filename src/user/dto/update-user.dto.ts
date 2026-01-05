import { AccountStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((obj) => obj.phone !== undefined)
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  @MaxLength(15)
  phone?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;

  @IsOptional()
  @IsBoolean()
  hasSeenVerificationCongrats?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  addressLine?: string;

  @IsOptional()
  @IsEnum(AccountStatus, { message: 'status not valid.' })
  status?: AccountStatus;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  newPassword?: string;
}
