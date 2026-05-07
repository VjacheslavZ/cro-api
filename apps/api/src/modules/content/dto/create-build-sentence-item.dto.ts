import {
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class BuildSentenceWordDto {
  @ApiProperty()
  @IsString()
  wordHr: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  distractors: string[];
}

export class CreateBuildSentenceItemDto {
  @ApiProperty()
  @IsUUID()
  topicId: string;

  @ApiProperty()
  @IsString()
  translationRu: string;

  @ApiProperty()
  @IsString()
  translationUk: string;

  @ApiProperty()
  @IsString()
  translationEn: string;

  @ApiProperty({ type: [BuildSentenceWordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BuildSentenceWordDto)
  @ArrayMinSize(1)
  words: BuildSentenceWordDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
