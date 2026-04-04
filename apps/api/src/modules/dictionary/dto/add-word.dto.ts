import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddWordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  wordHr: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  translation: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  collectionId?: string;
}
