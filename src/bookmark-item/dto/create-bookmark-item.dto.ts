import { BookmarkType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { Exists } from 'src/common/validators/exists.validator';

export class CreateBookmarkItemDto {
  @IsNotEmpty()
  @IsEnum(BookmarkType, { message: 'Bookmark type not found.' })
  type: BookmarkType;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('serviceItem', 'id', {
    message: 'serviceItemId does not exists.',
  })
  serviceItemId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('subServiceItem', 'id', {
    message: 'subServiceItemId does not exists.',
  })
  subServiceItemId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Exists('user', 'id', {
    message: 'manongId does not exists.',
  })
  manongId?: number;
}
