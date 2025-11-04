import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class LoginDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => !o.phone) // Only validate email if phone is empty
  @IsNotEmpty({ message: 'Email is required if phone is not provided' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((o) => !o.email) // Only validate phone if email is empty
  @IsNotEmpty({ message: 'Phone is required if email is not provided' })
  @IsString({ message: 'Phone must be a string' })
  phone: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}
