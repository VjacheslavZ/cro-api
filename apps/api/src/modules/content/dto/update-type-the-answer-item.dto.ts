import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateTypeTheAnswerItemDto } from './create-type-the-answer-item.dto';

export class UpdateTypeTheAnswerItemDto extends PartialType(
  OmitType(CreateTypeTheAnswerItemDto, ['topicId']),
) {}
