import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCashInManongWallet {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
