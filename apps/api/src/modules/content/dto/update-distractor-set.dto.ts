import { PartialType } from '@nestjs/swagger';

import { CreateDistractorSetDto } from './create-distractor-set.dto';

export class UpdateDistractorSetDto extends PartialType(CreateDistractorSetDto) {}
