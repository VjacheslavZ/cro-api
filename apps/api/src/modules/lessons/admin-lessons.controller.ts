import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AddLessonItemDto } from './dto/add-lesson-item.dto';

@ApiTags('Admin Lessons')
@Controller('admin/lessons')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminLessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'List all lessons' })
  async findAll() {
    return this.lessonsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a lesson' })
  async create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lesson' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.remove(id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add an item to a lesson' })
  async addItem(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddLessonItemDto) {
    return this.lessonsService.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an item from a lesson' })
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.lessonsService.removeItem(id, itemId);
  }
}
