import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartReviewDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  count?: number = 20;
}
