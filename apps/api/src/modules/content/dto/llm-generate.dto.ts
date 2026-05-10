import { IsObject, IsOptional, IsString } from 'class-validator';

export class LlmGenerateDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsObject()
  @IsOptional()
  options?: Record<string, number>;
}
