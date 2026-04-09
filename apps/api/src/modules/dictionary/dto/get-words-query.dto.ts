import { IsUUID, IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetWordsQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'progress'] })
  @IsIn(['newest', 'oldest', 'progress'])
  @IsOptional()
  sort?: string;
}
