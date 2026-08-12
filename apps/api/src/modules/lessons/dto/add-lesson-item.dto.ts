import { IsEnum, IsInt, IsUUID, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonItemType } from '@cro/shared';

export class AddLessonItemDto {
  @ApiProperty({ enum: LessonItemType })
  @IsEnum(LessonItemType)
  itemType: LessonItemType;

  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
