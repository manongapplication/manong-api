import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateReferralCodeDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', { message: 'userId not found!' })
  ownerId: number;
}
