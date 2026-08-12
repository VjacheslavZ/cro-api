import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleHr: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleRu: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleUk: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionHr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionRu?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionUk?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
