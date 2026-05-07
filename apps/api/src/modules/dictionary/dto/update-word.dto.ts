import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWordDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  wordHr?: string;

  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  translation?: string;
}
