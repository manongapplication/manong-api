import { IsArray, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class JobFeesPaymentStatusDto {
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}
