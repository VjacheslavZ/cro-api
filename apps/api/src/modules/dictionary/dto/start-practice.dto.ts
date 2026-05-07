import { IsUUID, IsOptional, IsInt, Min, Max, IsArray, IsIn, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartPracticeDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  count?: number = 10;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  wordIds?: string[];

  @ApiPropertyOptional({
    enum: ['word-to-translate', 'translate-to-word', 'letter-pick', 'matching'],
  })
  @IsIn(['word-to-translate', 'translate-to-word', 'letter-pick', 'matching'])
  @IsOptional()
  exerciseType?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'progress'] })
  @IsIn(['newest', 'oldest', 'progress'])
  @IsOptional()
  filter?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  learnedOnly?: boolean;
}
