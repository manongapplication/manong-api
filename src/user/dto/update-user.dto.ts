import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  @ValidateIf((obj) => obj.phone !== undefined)
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  @MaxLength(15)
  phone?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}
