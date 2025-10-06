import { IsOptional, IsString } from 'class-validator';

export class CreateAttachIntentDto {
  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  return_url?: string;
}
