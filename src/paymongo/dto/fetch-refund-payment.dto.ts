import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class FetchRefundPaymentDto {
  @IsNotEmpty()
  @Type(() => Number)
  @Exists('users', 'id', { message: 'User not found.' })
  userId: number;

  @IsNotEmpty()
  @Type(() => Number)
  @Exists('serviceRequest', 'id', { message: 'serviceRequest not found.' })
  serviceRequest: number;
}
