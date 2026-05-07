import {
  IsArray,
  IsBoolean,
  IsString,
  IsUUID,
  IsOptional,
  IsIn,
  ValidateNested,
  IsInt,
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

class SpeedQuizOutcomeItem {
  @ApiProperty()
  @IsUUID()
  wordId: string;

  @ApiProperty({ enum: [0, 100] })
  @IsInt()
  progressTarget: 0 | 100;
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

  @ApiPropertyOptional({ type: [SpeedQuizOutcomeItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpeedQuizOutcomeItem)
  @IsOptional()
  speedQuizOutcomes?: SpeedQuizOutcomeItem[];
}
