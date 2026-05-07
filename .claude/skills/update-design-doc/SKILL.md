---
name: update-design-doc
description: Reminds Claude to offer updating docs/design-web.md after modifying web app screens, components, routes, i18n, or shared types. Auto-loads when editing those files.
paths:
  - "apps/web/src/app/AppRouter.tsx"
  - "apps/web/src/features/**/*.tsx"
  - "apps/web/src/features/**/*.ts"
  - "apps/web/src/components/**/*.tsx"
  - "apps/web/src/i18n/locales/*.json"
  - "packages/shared/src/types/**/*.ts"
---

# Design Doc Maintenance Rule

After completing any change to a file matched by this skill's paths, check whether `docs/design-web.md` needs updating.

## What not to offer

Do **not** offer an update for:
- Internal refactors (rename a variable, extract a hook, move a file) that don't change the screen's observable UI, states, or routes
- Styling-only changes (colors, spacing, font tweaks) with no layout impact
- Query caching, state management, or performance changes invisible to the user
