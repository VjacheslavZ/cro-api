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
import { Throttle } from '@nestjs/throttler';

import { AdminGuard } from '../admin-auth/guards/admin.guard';
import { CurrentAdmin, AdminPayload } from '../../common/decorators/current-admin.decorator';
import { DictionaryCollectionsService } from './dictionary-collections.service';
import { DictionaryService } from './dictionary.service';
import { AdminCreateCollectionDto } from './dto/admin-create-collection.dto';
import { AdminUpdateCollectionDto } from './dto/admin-update-collection.dto';
import { CreatePredefinedWordDto } from './dto/create-predefined-word.dto';
import { UpdatePredefinedWordDto } from './dto/update-predefined-word.dto';
import { GetAiTranslationQueryDto } from './dto/get-ai-translation-query.dto';
import { ImportPredefinedWordsDto } from './dto/import-predefined-words.dto';

@ApiTags('Admin Dictionary')
@Controller('admin/dictionary-collections')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminDictionaryController {
  constructor(
    private collectionsService: DictionaryCollectionsService,
    private dictionaryService: DictionaryService,
  ) {}

  @Get('ai-translation')
  @ApiOperation({ summary: 'Get AI translations for a Croatian word in all 3 languages' })
  async getAiTranslation(@Query() query: GetAiTranslationQueryDto) {
    return this.dictionaryService.getAiTranslationAdmin(query.word);
  }

  @Get()
  @ApiOperation({ summary: 'List all predefined collections' })
  async getCollections() {
    return this.collectionsService.adminGetCollections();
  }

  @Post()
  @ApiOperation({ summary: 'Create a predefined collection' })
  async createCollection(
    @CurrentAdmin() admin: AdminPayload,
    @Body() dto: AdminCreateCollectionDto,
  ) {
    return this.collectionsService.adminCreateCollection(admin.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a predefined collection' })
  async updateCollection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateCollectionDto,
  ) {
    return this.collectionsService.adminUpdateCollection(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a predefined collection' })
  async deleteCollection(@Param('id', ParseUUIDPipe) id: string) {
    await this.collectionsService.adminDeleteCollection(id);
  }

  // --- Predefined words within a collection ---

  @Get(':id/words')
  @ApiOperation({ summary: 'List words in a predefined collection' })
  async getCollectionWords(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectionsService.adminGetCollectionWords(id);
  }

  @Post(':id/words')
  @ApiOperation({ summary: 'Add a word to a predefined collection' })
  async addCollectionWord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePredefinedWordDto,
  ) {
    return this.collectionsService.adminAddCollectionWord(id, dto);
  }

  // A large CSV arrives as many sequential batches, so this route gets a higher limit than the
  // global 100 requests/minute.
  @Post(':id/words/import')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 200 } })
  @ApiOperation({
    summary: 'Bulk-import a batch of words (from CSV) into a predefined collection',
    description:
      'Existing words and in-batch duplicates are skipped. Returns { created, skipped }.',
  })
  async importCollectionWords(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ImportPredefinedWordsDto,
  ) {
    return this.collectionsService.adminImportCollectionWords(id, dto);
  }

  @Patch('words/:wordId')
  @ApiOperation({ summary: 'Update a predefined word' })
  async updateCollectionWord(
    @Param('wordId', ParseUUIDPipe) wordId: string,
    @Body() dto: UpdatePredefinedWordDto,
  ) {
    return this.collectionsService.adminUpdateCollectionWord(wordId, dto);
  }

  @Delete('words/:wordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a predefined word' })
  async deleteCollectionWord(@Param('wordId', ParseUUIDPipe) wordId: string) {
    await this.collectionsService.adminDeleteCollectionWord(wordId);
  }
}
