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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { ContentService } from './content.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdateTopicTypesDto } from './dto/update-topic-types.dto';
import { CreateTypeTheAnswerItemDto } from './dto/create-type-the-answer-item.dto';
import { UpdateTypeTheAnswerItemDto } from './dto/update-type-the-answer-item.dto';
import { CreateFlashcardItemDto } from './dto/create-flashcard-item.dto';
import { UpdateFlashcardItemDto } from './dto/update-flashcard-item.dto';
import { CreateFillInBlankItemDto } from './dto/create-fill-in-blank-item.dto';
import { UpdateFillInBlankItemDto } from './dto/update-fill-in-blank-item.dto';
import { CreateBuildSentenceItemDto } from './dto/create-build-sentence-item.dto';
import { UpdateBuildSentenceItemDto } from './dto/update-build-sentence-item.dto';
import { UpdateBuildSentenceWordDto } from './dto/update-build-sentence-word.dto';
import { LlmGenerateDto } from './dto/llm-generate.dto';

@ApiTags('Admin Content')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminContentController {
  constructor(private contentService: ContentService) {}

  // --- Topics ---

  @Get('topics')
  @ApiOperation({ summary: 'List all topics (including inactive)' })
  async getAllTopics() {
    return this.contentService.getAllTopics();
  }

  @Post('topics')
  @ApiOperation({ summary: 'Create a topic' })
  async createTopic(@Body() dto: CreateTopicDto) {
    return this.contentService.createTopic(dto);
  }

  @Patch('topics/:id')
  @ApiOperation({ summary: 'Update a topic' })
  async updateTopic(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTopicDto) {
    return this.contentService.updateTopic(id, dto);
  }

  @Delete('topics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a topic' })
  async deleteTopic(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteTopic(id);
  }

  @Patch('topics/:id/exercise-types')
  @ApiOperation({ summary: 'Update exercise types enabled for a topic' })
  async updateTopicTypes(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTopicTypesDto) {
    return this.contentService.updateTopicTypes(id, dto.configs);
  }

  // --- Type The Answer Items ---

  @Get('topics/:topicId/type-the-answer-items')
  @ApiOperation({ summary: 'List Type the Answer items for a topic' })
  async getTypeTheAnswerItems(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.contentService.getTypeTheAnswerItems(topicId);
  }

  @Post('type-the-answer-items')
  @ApiOperation({ summary: 'Create a Type the Answer item' })
  async createTypeTheAnswerItem(@Body() dto: CreateTypeTheAnswerItemDto) {
    return this.contentService.createTypeTheAnswerItem(dto);
  }

  @Patch('type-the-answer-items/:id')
  @ApiOperation({ summary: 'Update a Type the Answer item' })
  async updateTypeTheAnswerItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTypeTheAnswerItemDto,
  ) {
    return this.contentService.updateTypeTheAnswerItem(id, dto);
  }

  @Delete('type-the-answer-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a Type the Answer item' })
  async deleteTypeTheAnswerItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteTypeTheAnswerItem(id);
  }

  // --- Flashcard Items ---

  @Get('topics/:topicId/flashcard-items')
  @ApiOperation({ summary: 'List flashcard items for a topic' })
  async getFlashcardItems(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.contentService.getFlashcardItems(topicId);
  }

  @Post('flashcard-items')
  @ApiOperation({ summary: 'Create a flashcard item' })
  async createFlashcardItem(@Body() dto: CreateFlashcardItemDto) {
    return this.contentService.createFlashcardItem(dto);
  }

  @Patch('flashcard-items/:id')
  @ApiOperation({ summary: 'Update a flashcard item' })
  async updateFlashcardItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFlashcardItemDto,
  ) {
    return this.contentService.updateFlashcardItem(id, dto);
  }

  @Delete('flashcard-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a flashcard item' })
  async deleteFlashcardItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteFlashcardItem(id);
  }

  // --- Fill In Blank Items ---

  @Get('topics/:topicId/fill-in-blank-items')
  @ApiOperation({ summary: 'List fill-in-blank items for a topic' })
  async getFillInBlankItems(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.contentService.getFillInBlankItems(topicId);
  }

  @Post('fill-in-blank-items')
  @ApiOperation({ summary: 'Create a fill-in-blank item' })
  async createFillInBlankItem(@Body() dto: CreateFillInBlankItemDto) {
    return this.contentService.createFillInBlankItem(dto);
  }

  @Patch('fill-in-blank-items/:id')
  @ApiOperation({ summary: 'Update a fill-in-blank item' })
  async updateFillInBlankItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFillInBlankItemDto,
  ) {
    return this.contentService.updateFillInBlankItem(id, dto);
  }

  @Delete('fill-in-blank-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a fill-in-blank item' })
  async deleteFillInBlankItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteFillInBlankItem(id);
  }

  // --- Build Sentence Items ---

  @Get('topics/:topicId/build-sentence-items')
  @ApiOperation({ summary: 'List Build Sentence items for a topic' })
  async getBuildSentenceItems(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.contentService.getBuildSentenceItems(topicId);
  }

  @Get('topics/:topicId/build-sentence-items/check')
  @ApiOperation({ summary: 'Check if a Croatian sentence already exists in the topic' })
  async checkBuildSentenceDuplicate(
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Query('sentence') sentence: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.contentService.checkBuildSentenceDuplicate(topicId, sentence, excludeId);
  }

  @Post('build-sentence-items')
  @ApiOperation({ summary: 'Create a Build Sentence item' })
  async createBuildSentenceItem(@Body() dto: CreateBuildSentenceItemDto) {
    return this.contentService.createBuildSentenceItem(dto);
  }

  @Patch('build-sentence-items/:id')
  @ApiOperation({ summary: 'Update a Build Sentence item' })
  async updateBuildSentenceItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBuildSentenceItemDto,
  ) {
    return this.contentService.updateBuildSentenceItem(id, dto);
  }

  @Delete('build-sentence-items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a Build Sentence item' })
  async deleteBuildSentenceItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.contentService.deleteBuildSentenceItem(id);
  }

  @Patch('build-sentence-items/words/:wordId')
  @ApiOperation({ summary: 'Update distractors for a Build Sentence word' })
  async updateBuildSentenceWord(
    @Param('wordId', ParseUUIDPipe) wordId: string,
    @Body() dto: UpdateBuildSentenceWordDto,
  ) {
    return this.contentService.updateBuildSentenceWord(wordId, dto);
  }

  // --- LLM proxy ---

  @Post('llm/generate')
  @ApiOperation({ summary: 'Proxy a generate request to the local Ollama instance' })
  async llmGenerate(@Body() dto: LlmGenerateDto) {
    return this.contentService.llmGenerate(dto);
  }
}
