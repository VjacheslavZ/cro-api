import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateBuildSentenceItemDto } from './create-build-sentence-item.dto';

export class UpdateBuildSentenceItemDto extends PartialType(
  OmitType(CreateBuildSentenceItemDto, ['topicId']),
) {}
