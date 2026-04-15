---
name: nestjs-service-patterns
description: NestJS service, controller, and DTO coding patterns for cro-api. Auto-loads when editing modules. Covers HttpException usage, PrismaService injection, DTO structure, guard application, and common pitfalls.
paths:
  - "apps/api/src/modules/**/*.service.ts"
  - "apps/api/src/modules/**/*.controller.ts"
  - "apps/api/src/modules/**/*.dto.ts"
  - "apps/api/src/modules/**/*.module.ts"
---

# NestJS Service Patterns — cro-api

Apply these patterns when creating or modifying any file in `apps/api/src/modules/`.

---

## 1. Service Structure

```ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}
}
```

**Rules:**
- `@Injectable()` on every service — never omit it
- Inject `PrismaService` as `private prisma` (not `private readonly` — consistent with the codebase)
- Inject other services by their class type: `private progressService: ProgressService`
- Never instantiate services directly — always inject via constructor

---

## 2. Error Handling — HttpException Pattern

Use NestJS built-in exceptions — never throw raw `Error` or return error objects:

| Situation | Exception |
|-----------|-----------|
| Resource not found by ID | `NotFoundException('X not found')` |
| Unique constraint violation / already exists | `ConflictException('X already exists')` |
| User doesn't own the resource | `ForbiddenException('...')` |
| Invalid operation / business rule violated | `BadRequestException('...')` |
| Auth required but missing | `UnauthorizedException('...')` |

```ts
// Pattern: fetch-then-throw (used throughout the codebase)
async getById(id: string) {
  const item = await this.prisma.myModel.findUnique({ where: { id } });
  if (!item) throw new NotFoundException('Item not found');
  return item;
}

// Pattern: check-then-throw for conflict
async create(dto: CreateDto) {
  const existing = await this.prisma.myModel.findUnique({ where: { name: dto.name } });
  if (existing) throw new ConflictException('Item with this name already exists');
  return this.prisma.myModel.create({ data: dto });
}
```

**Never** use `try/catch` to suppress Prisma errors silently — let them propagate to NestJS's global error filter unless you have a specific recovery path.

---

## 3. DTO Pattern

Every request body uses a class with `class-validator` decorators and `@nestjs/swagger` annotations:

```ts
import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

**Update DTOs** always use `PartialType` — never duplicate field decorators:

```ts
import { PartialType } from '@nestjs/swagger';  // NOT from @nestjs/mapped-types
import { CreateItemDto } from './create-item.dto';

export class UpdateItemDto extends PartialType(CreateItemDto) {}
```

**Rules:**
- Import `PartialType` from `@nestjs/swagger` (not `@nestjs/mapped-types`) — Swagger integration requires it
- Every required field: `@ApiProperty()` + validator
- Every optional field: `@ApiPropertyOptional()` + `@IsOptional()` + validator
- `@IsOptional()` must come **before** other validators — class-validator short-circuits on optional
- Use `@Type(() => Number)` from `class-transformer` for numeric query params (strings from HTTP)
- File names: `create-{entity}.dto.ts`, `update-{entity}.dto.ts`, `get-{entity}-query.dto.ts`

---

## 4. Controller Pattern

```ts
import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MyService } from './my.service';
import { CreateItemDto } from './dto/create-item.dto';

@ApiTags('My Feature')
@Controller('my-feature')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MyController {
  constructor(private myService: MyService) {}

  @Post()
  @ApiOperation({ summary: 'Create an item' })
  async create(@CurrentUser() userId: string, @Body() dto: CreateItemDto) {
    return this.myService.create(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by ID' })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.myService.getById(id);
  }
}
```

**Rules:**
- `@ApiTags(...)` on every controller — groups endpoints in Swagger
- `@ApiOperation({ summary: '...' })` on every endpoint
- `ParseUUIDPipe` on every `:id` param — validates UUID format before hitting the service
- `ParseEnumPipe(MyEnum)` for enum route params (e.g. `exerciseType`)
- `@CurrentUser()` decorator to extract userId from JWT payload — never access `req.user` directly
- Thin controllers: delegate all logic to the service, no business logic in controllers

---

## 5. Guards

Two auth guards in this codebase:

| Guard | Protects | JWT claim |
|-------|----------|-----------|
| `JwtAuthGuard` | Student endpoints | `sub` = userId, `type` omitted or `"student"` |
| `AdminGuard` | Admin endpoints | `type: "admin"` claim required |

```ts
// Student endpoint
@UseGuards(JwtAuthGuard)

// Admin endpoint
@UseGuards(AdminGuard)

// No auth (e.g. Stripe webhook raw body — uses its own signature verification)
// Omit @UseGuards entirely
```

Apply guards at the **controller level** when all routes in a controller share the same guard. Apply at the **method level** only when a controller mixes public and protected routes.

---

## 6. Prisma Usage Patterns

```ts
// Prefer findUnique for ID lookups — indexed, throws clear error
await this.prisma.myModel.findUnique({ where: { id } });

// Use Promise.all for independent parallel queries — never await in sequence
const [session, topic] = await Promise.all([
  this.prisma.exerciseSession.create({ data: { ... } }),
  this.prisma.exerciseTopic.findUnique({ where: { id: topicId } }),
]);

// createMany with skipDuplicates for bulk upsert-like inserts
await this.prisma.myModel.createMany({ data: [...], skipDuplicates: true });

// Transactions for operations that must succeed or fail together
await this.prisma.$transaction([
  this.prisma.a.update({ ... }),
  this.prisma.b.delete({ ... }),
]);
```

**Never** use `prisma.myModel.findFirst` when you have a unique key — use `findUnique` instead (type-safe and indexed).

---

## 7. Module Registration

Every new service/controller must be registered in its module:

```ts
@Module({
  imports: [PrismaModule, OtherModule],
  controllers: [MyController],
  providers: [MyService],
  exports: [MyService],  // only if other modules inject this service
})
export class MyModule {}
```

**Rules:**
- Export services only when another module injects them — don't export everything by default
- Import the module (not just the service) when using services from other modules
- `PrismaModule` is globally provided — no need to import it in most modules
