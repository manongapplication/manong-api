import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateReferralCodeDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  deviceId: string;
}
