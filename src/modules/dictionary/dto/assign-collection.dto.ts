import { IsUUID, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignCollectionDto {
  @ApiPropertyOptional({ description: 'Collection ID or null to unassign' })
  @IsUUID()
  @IsOptional()
  collectionId: string | null;
}
