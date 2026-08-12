import { IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAiTranslationQueryDto {
  @ApiProperty({
    description: 'Croatian word or short phrase to translate (letters, hyphens, spaces only)',
  })
  @IsString()
  @Matches(/^[\p{L}\-\s]+$/u, { message: 'word must contain only letters, hyphens or spaces' })
  @MaxLength(50)
  word: string;
}
