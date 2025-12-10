import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckUpdateDto {
  @ApiProperty({ enum: ['android', 'ios'], description: 'User platform' })
  @IsString()
  platform: string;

  @ApiProperty({ example: '1.9.0', description: 'Current app version' })
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'currentVersion must be in SemVer format',
  })
  currentVersion: string;

  @ApiProperty({
    required: false,
    example: '14',
    description: 'Current build number',
  })
  @IsOptional()
  @IsString()
  currentBuild?: string;
}
