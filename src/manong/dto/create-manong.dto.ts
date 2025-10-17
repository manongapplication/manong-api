import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateManongDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 15)
  phone: string;

  @IsArray()
  @IsNotEmpty()
  serviceItems: number[];

  @IsArray()
  @IsNotEmpty()
  subServiceItems: number[];

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  experienceDescription?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  skillImage?: Express.Multer.File[];

  @IsOptional()
  nbiImage?: Express.Multer.File[];

  @IsOptional()
  govIdImage?: Express.Multer.File[];

  @IsOptional()
  @Type(() => Number)
  maxDailyServices?: number;

  @IsString()
  @IsNotEmpty()
  password: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  yearsExperience: number;
}
