import { Type } from 'class-transformer';
import { EditableServiceItem } from '../types/editable-service-item.types';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';

export class CreateServiceItems {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditableServiceItem)
  serviceItems: EditableServiceItem[];
}
