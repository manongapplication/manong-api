import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phone: string;

  @IsOptional()
  @IsString()
  code?: string;
}
