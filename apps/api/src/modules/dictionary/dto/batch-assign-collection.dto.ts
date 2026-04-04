import { IsArray, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchAssignCollectionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  wordIds: string[];

  @ApiPropertyOptional({ description: 'Collection ID or null to unassign' })
  @IsUUID()
  @IsOptional()
  collectionId: string | null;
}
