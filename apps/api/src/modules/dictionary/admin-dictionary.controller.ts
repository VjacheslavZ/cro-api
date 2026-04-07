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
import { CurrentAdmin, AdminPayload } from '../../common/decorators/current-admin.decorator';
import { DictionaryCollectionsService } from './dictionary-collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CreatePredefinedWordDto } from './dto/create-predefined-word.dto';
import { UpdatePredefinedWordDto } from './dto/update-predefined-word.dto';

@ApiTags('Admin Dictionary')
@Controller('admin/dictionary-collections')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminDictionaryController {
  constructor(private collectionsService: DictionaryCollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all predefined collections' })
  async getCollections() {
    return this.collectionsService.adminGetCollections();
  }

  @Post()
  @ApiOperation({ summary: 'Create a predefined collection' })
  async createCollection(@CurrentAdmin() admin: AdminPayload, @Body() dto: CreateCollectionDto) {
    return this.collectionsService.adminCreateCollection(admin.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a predefined collection' })
  async updateCollection(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollectionDto) {
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
