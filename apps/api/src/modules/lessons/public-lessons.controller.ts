import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { LessonsService } from './lessons.service';

@ApiTags('Lessons')
@Controller('lessons')
@UseGuards(BetterAuthGuard)
@ApiBearerAuth()
export class PublicLessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'List active lessons' })
  async findAll() {
    return this.lessonsService.findAllActive();
  }
}
