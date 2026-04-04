import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class DictionaryCollectionsService {
  constructor(private prisma: PrismaService) {}

  async getCollections(userId: string) {
    const [publicCollections, userCollections] = await Promise.all([
      this.prisma.dictionaryCollection.findMany({
        where: { isPublic: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { words: true } } },
      }),
      this.prisma.dictionaryCollection.findMany({
        where: { createdByUserId: userId },
        orderBy: { name: 'asc' },
        include: { _count: { select: { words: true } } },
      }),
    ]);

    return [
      ...publicCollections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isPublic: c.isPublic,
        wordCount: c._count.words,
        type: 'predefined' as const,
      })),
      ...userCollections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        isPublic: c.isPublic,
        wordCount: c._count.words,
        type: 'personal' as const,
      })),
    ];
  }

  async createCollection(userId: string, dto: CreateCollectionDto) {
    const collection = await this.prisma.dictionaryCollection.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdByUserId: userId,
        isPublic: false,
      },
    });
    return { ...collection, wordCount: 0, type: 'personal' as const };
  }

  async updateCollection(userId: string, id: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdByUserId !== userId) throw new ForbiddenException();

    return this.prisma.dictionaryCollection.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCollection(userId: string, id: string) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdByUserId !== userId) throw new ForbiddenException();

    await this.prisma.dictionaryCollection.delete({ where: { id } });
  }

  // --- Admin methods ---

  async adminGetCollections() {
    const collections = await this.prisma.dictionaryCollection.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { words: true } } },
    });

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isPublic: c.isPublic,
      sortOrder: c.sortOrder,
      wordCount: c._count.words,
    }));
  }

  async adminCreateCollection(adminId: string, dto: CreateCollectionDto) {
    return this.prisma.dictionaryCollection.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdByAdminId: adminId,
        isPublic: true,
      },
    });
  }

  async adminUpdateCollection(id: string, dto: UpdateCollectionDto) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    return this.prisma.dictionaryCollection.update({
      where: { id },
      data: dto,
    });
  }

  async adminDeleteCollection(id: string) {
    const collection = await this.prisma.dictionaryCollection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    if (!collection.isPublic) throw new ForbiddenException('Not an admin collection');

    await this.prisma.dictionaryCollection.delete({ where: { id } });
  }
}
