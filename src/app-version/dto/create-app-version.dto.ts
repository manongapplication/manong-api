import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches,
} from 'class-validator';
import { UpdatePriority } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppVersionDto {
  @ApiProperty({
    enum: ['android', 'ios'],
    description: 'Platform for this version',
  })
  @IsString()
  platform: string;

  @ApiProperty({ example: '2.0.0', description: 'Version in SemVer format' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in SemVer format (e.g., 1.0.0)',
  })
  version: string;

  @ApiProperty({ example: 15, description: 'Build number (incremental)' })
  @IsNumber()
  buildNumber: number;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Is this update mandatory?',
  })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiProperty({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    enum: UpdatePriority,
    required: false,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    default: UpdatePriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(UpdatePriority)
  priority?: UpdatePriority;

  @ApiProperty({
    required: false,
    example: '1.9.0',
    description: 'Minimum version that requires update',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'minVersion must be in SemVer format',
  })
  minVersion?: string;

  @ApiProperty({
    required: false,
    description: 'Detailed release notes (markdown)',
  })
  @IsOptional()
  @IsString()
  releaseNotes?: string;

  @ApiProperty({
    required: false,
    example: 'New chat features added',
    description: 'Short description for users',
  })
  @IsOptional()
  @IsString()
  whatsNew?: string;

  @ApiProperty({ required: false, description: 'Android Play Store URL' })
  @IsOptional()
  @IsString()
  androidStoreUrl?: string;

  @ApiProperty({ required: false, description: 'iOS App Store URL' })
  @IsOptional()
  @IsString()
  iosStoreUrl?: string;

  @ApiProperty({
    required: false,
    description: 'Date when update becomes mandatory (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  forceUpdateDate?: string;
}
