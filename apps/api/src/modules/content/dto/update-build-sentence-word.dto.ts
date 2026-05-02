import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBuildSentenceWordDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  distractors: string[];
}
