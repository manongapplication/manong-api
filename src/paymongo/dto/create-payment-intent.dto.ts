import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsInt()
  amount: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsString()
  description: string;

  @IsString()
  capture_type: string;
}
