import { IsString, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePredefinedWordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  wordHr: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translationRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translationUk: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translationEn: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
