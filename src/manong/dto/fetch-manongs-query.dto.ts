import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FetchManongsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  serviceItemId?: number;
}
