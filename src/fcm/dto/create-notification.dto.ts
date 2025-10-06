import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  token: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  serviceRequestId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsNumber()
  userId: number;
}
