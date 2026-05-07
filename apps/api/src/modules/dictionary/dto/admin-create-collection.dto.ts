import { IsString, IsOptional, MinLength, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCreateCollectionDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nameRu: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nameUk: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nameEn: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;
}
