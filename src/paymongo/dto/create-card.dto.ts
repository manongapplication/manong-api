import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateCardDto {
  @IsOptional()
  @IsNumberString()
  @Length(13, 19)
  number?: string;

  @IsOptional()
  @IsNumberString()
  expMonth?: string;

  @IsOptional()
  @IsNumberString()
  expYear?: string;

  @IsOptional()
  @IsNumberString()
  @Length(3, 4)
  cvc?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  cardHolderName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
