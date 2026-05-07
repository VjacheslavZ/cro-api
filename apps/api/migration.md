# Prisma Migration Guide

All commands must be run from `apps/api/` unless stated otherwise.

---

## Check pending migrations

```bash
npx prisma migrate status --schema=src/prisma/schema.prisma
```

Shows which migrations have been applied and which are still pending.

---

## Apply all pending migrations

```bash
npx prisma migrate dev --schema=src/prisma/schema.prisma
```

Applies every unapplied migration from `src/prisma/migrations/` in timestamp order.
Also regenerates the Prisma client automatically.

---

## Apply a single migration file directly (manual SQL)

Use this when you need to run one specific SQL file without touching migration history:

```bash
npx prisma db execute \
  --file src/prisma/migrations/<folder>/migration.sql \
  --schema=src/prisma/schema.prisma
```

Example:
```bash
npx prisma db execute \
  --file src/prisma/migrations/20260415000001_rename_plural_form_to_answer_in_type_the_answer_item/migration.sql \
  --schema=src/prisma/schema.prisma
```

This runs the SQL directly against the database — it does **not** update `_prisma_migrations`.

---

## Create a new migration (SQL only, do not apply yet)

```bash
npx prisma migrate dev \
  --schema=src/prisma/schema.prisma \
  --create-only \
  --name <migration_name>
```

Creates a new migration file in `src/prisma/migrations/` based on the schema diff.
Review and edit the generated SQL before applying.

---

## Regenerate the Prisma client after schema changes

```bash
npm run -w cro-api prisma:generate
```

Or from inside `apps/api/`:
```bash
npx prisma generate --schema=src/prisma/schema.prisma
```

Run this after any schema change or after applying migrations manually via `prisma db execute`.

---

## Writing safe manual migrations (rename instead of drop+add)

Prisma does not know how to rename — it generates `DROP COLUMN` + `ADD COLUMN` which loses data.
When renaming a table or column, always write the migration SQL by hand:

**Rename a table:**
```sql
ALTER TABLE "OldTableName" RENAME TO "NewTableName";
```

**Rename a column:**
```sql
ALTER TABLE "TableName" RENAME COLUMN "oldColumn" TO "newColumn";
```

Place the file in `src/prisma/migrations/<timestamp>_<name>/migration.sql` before running `prisma migrate dev`.

---

## Run from monorepo root

```bash
npm run -w cro-api prisma:migrate   # apply pending migrations
npm run -w cro-api prisma:generate  # regenerate client
npm run -w cro-api seed             # seed the database
```
