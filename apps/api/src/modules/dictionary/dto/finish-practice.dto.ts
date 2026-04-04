import { IsArray, IsBoolean, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
}
