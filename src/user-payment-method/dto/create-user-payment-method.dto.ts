import { IsEmail, IsInt, IsOptional, IsString } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateUserPaymentMethodDto {
  @IsInt()
  @Exists('paymentMethod', 'id')
  paymentMethodId: number;

  @IsString()
  provider: string;

  @IsOptional()
  @IsString()
  paymentMethodIdOnGateway: string;

  @IsOptional()
  @IsString()
  last4: string;

  @IsOptional()
  @IsInt()
  expMonth: number;

  @IsOptional()
  @IsInt()
  expYear: number;

  @IsOptional()
  @IsString()
  cardHolderName: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  billingEmail: string;

  @IsOptional()
  customerId?: string | null;
}
