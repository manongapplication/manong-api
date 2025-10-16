import { VerificationStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProviderVerificationDto {
  @Type(() => Number)
  @IsNumber()
  userId: number;

  @IsString()
  documentType: string;

  @IsString()
  documentUrl: string;

  @IsOptional()
  @IsEnum(VerificationStatus, { message: 'verificationStatus must be valid.' })
  status?: VerificationStatus;
}
