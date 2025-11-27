import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class UpdateReferralCodeDto {
  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', { message: 'userId not found!' })
  ownerId: number;
}
