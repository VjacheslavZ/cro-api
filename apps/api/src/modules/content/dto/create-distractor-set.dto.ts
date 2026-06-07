import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayUnique, MinLength, IsNotEmpty } from 'class-validator';

export class CreateDistractorSetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MinLength(1, { each: true })
  @ArrayUnique()
  words: string[];
}
