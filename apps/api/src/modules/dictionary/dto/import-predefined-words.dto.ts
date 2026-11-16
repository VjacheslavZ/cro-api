import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Rows accepted per request. The admin panel splits a larger CSV into batches of this size or less. */
export const IMPORT_PREDEFINED_WORDS_MAX_BATCH = 1000;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ImportPredefinedWordRowDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  wordHr: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translationRu: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translationUk: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translationEn: string;
}

export class ImportPredefinedWordsDto {
  @ApiProperty({
    type: [ImportPredefinedWordRowDto],
    description: `One batch of rows, at most ${IMPORT_PREDEFINED_WORDS_MAX_BATCH}`,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(IMPORT_PREDEFINED_WORDS_MAX_BATCH)
  @ValidateNested({ each: true })
  @Type(() => ImportPredefinedWordRowDto)
  words: ImportPredefinedWordRowDto[];
}
