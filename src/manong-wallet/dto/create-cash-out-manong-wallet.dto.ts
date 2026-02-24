import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCashOutManongWallet {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  bankCode: string;

  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsNotEmpty()
  @IsNumber()
  accountNumber: number;

  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  notes: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
