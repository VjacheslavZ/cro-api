import { PartialType } from '@nestjs/swagger';

import { CreatePredefinedWordDto } from './create-predefined-word.dto';

export class UpdatePredefinedWordDto extends PartialType(CreatePredefinedWordDto) {}
