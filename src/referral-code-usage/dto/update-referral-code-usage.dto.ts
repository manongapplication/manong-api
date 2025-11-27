import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class UpdateReferralCodeUsageDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('referralCode', 'id', { message: 'referralCodeId not found' })
  referralCodeId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', { message: 'User not found' })
  userId?: number;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
