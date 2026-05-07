import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddSetDto {
  @ApiPropertyOptional({
    description: 'Specific predefined word IDs to add. If omitted, all words are added.',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  wordIds?: string[];
}
