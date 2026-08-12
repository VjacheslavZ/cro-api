import { IsArray, IsUUID, IsIn, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DictionaryReviewAnswerItem {
  @ApiProperty()
  @IsUUID()
  wordId: string;

  @ApiProperty({ enum: [1, 2, 3, 4], description: '1=Again 2=Hard 3=Good 4=Easy' })
  @IsIn([1, 2, 3, 4])
  rating: 1 | 2 | 3 | 4;
}

export class FinishReviewDto {
  @ApiProperty({ type: [DictionaryReviewAnswerItem] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DictionaryReviewAnswerItem)
  answers: DictionaryReviewAnswerItem[];
}
