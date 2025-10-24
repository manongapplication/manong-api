import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateFeedbackDto {
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @Exists('serviceRequest', 'id', {
    message: 'serviceRequestId does not exists.',
  })
  serviceRequestId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', {
    message: 'revieweeId does not exists.',
  })
  revieweeId: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  comment?: string;

  @IsOptional()
  @IsString()
  attachmentsPath?: string;
}
