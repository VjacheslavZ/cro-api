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
import { NativeLanguage } from '@cro/shared';

import { BetterAuthGuard } from '../auth/guards/better-auth.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { DictionaryService } from './dictionary.service';
import { DictionaryCollectionsService } from './dictionary-collections.service';
import { DictionaryPracticeService } from './dictionary-practice.service';
import { AddWordDto } from './dto/add-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsQueryDto } from './dto/get-words-query.dto';
import { AssignCollectionDto } from './dto/assign-collection.dto';
import { BatchAssignCollectionDto } from './dto/batch-assign-collection.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddSetDto } from './dto/add-set.dto';
import { StartPracticeDto } from './dto/start-practice.dto';
import { FinishPracticeDto } from './dto/finish-practice.dto';

@ApiTags('Dictionary')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard)
@Controller('dictionary')
export class DictionaryController {
  constructor(
    private dictionaryService: DictionaryService,
    private collectionsService: DictionaryCollectionsService,
    private practiceService: DictionaryPracticeService,
    private prisma: PrismaService,
  ) {}

  // --- Words ---

  @Get('words')
  @ApiOperation({ summary: 'Get paginated dictionary words' })
  async getWords(@CurrentUser() user: UserPayload, @Query() query: GetWordsQueryDto) {
    return this.dictionaryService.getWords(user.id, query);
  }

  @Post('words')
  @ApiOperation({ summary: 'Add a word to dictionary' })
  async addWord(@CurrentUser() user: UserPayload, @Body() dto: AddWordDto) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { nativeLanguage: true },
    });
    if (!dbUser.nativeLanguage) {
      throw new Error('Native language not set');
    }
    return this.dictionaryService.addWord(user.id, dto, dbUser.nativeLanguage as NativeLanguage);
  }

  @Patch('words/:id')
  @ApiOperation({ summary: 'Update a word in dictionary' })
  async updateWord(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWordDto,
  ) {
    return this.dictionaryService.updateWord(user.id, id, dto);
  }

  @Patch('words/:id/progress/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset word progress to 0%' })
  async resetWordProgress(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.dictionaryService.resetWordProgress(user.id, id);
  }

  @Patch('words/:id/learned')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a word as learned (all progress at 100%)' })
  async markWordAsLearned(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.dictionaryService.markWordAsLearned(user.id, id);
  }

  @Delete('words/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a word from dictionary' })
  async deleteWord(@CurrentUser() user: UserPayload, @Param('id', ParseUUIDPipe) id: string) {
    await this.dictionaryService.deleteWord(user.id, id);
  }

  @Patch('words/:id/collection')
  @ApiOperation({ summary: 'Assign or unassign a word to a collection' })
  async assignCollection(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCollectionDto,
  ) {
    return this.dictionaryService.assignCollection(user.id, id, dto.collectionId);
  }

  @Patch('words/batch')
  @ApiOperation({ summary: 'Batch assign words to a collection' })
  async batchAssignCollection(
    @CurrentUser() user: UserPayload,
    @Body() dto: BatchAssignCollectionDto,
  ) {
    await this.dictionaryService.batchAssignCollection(user.id, dto.wordIds, dto.collectionId);
  }

  // --- Suggestions ---

  @Get('suggestions')
  @ApiOperation({ summary: 'Get translation suggestions from shared pool' })
  async getSuggestions(@CurrentUser() user: UserPayload, @Query('word') word: string) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { nativeLanguage: true },
    });
    if (!dbUser.nativeLanguage) return [];
    return this.dictionaryService.getSuggestions(word, dbUser.nativeLanguage as NativeLanguage);
  }

  // --- Collections ---

  @Get('collections')
  @ApiOperation({ summary: 'Get user collections (predefined + personal)' })
  async getCollections(@CurrentUser() user: UserPayload) {
    return this.collectionsService.getCollections(user.id);
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create a personal collection' })
  async createCollection(@CurrentUser() user: UserPayload, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.createCollection(user.id, dto);
  }

  @Patch('collections/:id')
  @ApiOperation({ summary: 'Update a personal collection' })
  async updateCollection(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.updateCollection(user.id, id, dto);
  }

  @Delete('collections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a personal collection' })
  async deleteCollection(@CurrentUser() user: UserPayload, @Param('id', ParseUUIDPipe) id: string) {
    await this.collectionsService.deleteCollection(user.id, id);
  }

  @Get('collections/:id/words')
  @ApiOperation({ summary: 'Get predefined words in a collection' })
  async getCollectionWords(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectionsService.getCollectionWords(id);
  }

  @Post('collections/:id/add-set')
  @ApiOperation({ summary: 'Add words from a predefined collection to user dictionary' })
  async addSet(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddSetDto,
  ) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { nativeLanguage: true },
    });
    if (!dbUser.nativeLanguage) {
      throw new Error('Native language not set');
    }
    return this.dictionaryService.addSet(
      user.id,
      id,
      dbUser.nativeLanguage as NativeLanguage,
      dto.wordIds,
    );
  }

  // --- Practice ---

  @Post('practice/sessions')
  @ApiOperation({ summary: 'Start a dictionary practice session' })
  async startPractice(@CurrentUser() user: UserPayload, @Body() dto: StartPracticeDto) {
    return this.practiceService.startSession(user.id, dto);
  }

  @Post('practice/sessions/:id/finish')
  @ApiOperation({ summary: 'Finish a dictionary practice session' })
  async finishPractice(
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FinishPracticeDto,
  ) {
    return this.practiceService.finishSession(user.id, id, dto);
  }
}
