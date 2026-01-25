import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateManongWalletDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', { message: 'Manong not found.' })
  manongId: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
