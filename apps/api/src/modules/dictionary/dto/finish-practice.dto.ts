import {
  IsArray,
  IsBoolean,
  IsString,
  IsUUID,
  IsOptional,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DictionaryPracticeAnswerItem {
  @ApiProperty()
  @IsUUID()
  wordId: string;

  @ApiProperty()
  @IsString()
  givenAnswer: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;
}

export class FinishPracticeDto {
  @ApiProperty({ type: [DictionaryPracticeAnswerItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DictionaryPracticeAnswerItem)
  answers: DictionaryPracticeAnswerItem[];

  @ApiPropertyOptional({
    enum: ['word-to-translate', 'translate-to-word', 'letter-pick', 'matching'],
  })
  @IsIn(['word-to-translate', 'translate-to-word', 'letter-pick', 'matching'])
  @IsOptional()
  exerciseType?: string;
}
