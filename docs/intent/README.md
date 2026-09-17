# Intent

Long-lived statements of **why** and **what** — product goals, architectural decisions, invariants that AI agents and humans must not violate. Written *before* code; still true *after* the work is done.

What lives here vs. elsewhere:

| Question | Location |
| -------- | -------- |
| Why are we doing this, what is the target state, what are the non-goals | `docs/intent/` (this folder — ADRs, principles) |
| Concrete requirements for one feature / phase | `docs/prd-*.md` (`/prd` skill) |
| How to get there, in which order | `docs/plan-*.md` (`/plan-phase` skill) |
| How the code is structured today, commands, conventions | `CLAUDE.md` files, `.claude/skills/` |

Rules:

- Every non-trivial feature or migration starts with an intent document (ADR) or a PRD that links to one. The PR that implements it links back.
- ADRs are numbered and never deleted. A reversed decision gets a new ADR that supersedes the old one.
- When an ADR changes the stack, update the affected `CLAUDE.md` / agent / skill files in the **same PR** so agents stop generating code for the old stack.

## Index

| ADR | Title | Status |
| --- | ----- | ------ |
| [001](adr-001-web-mui-to-tailwind-shadcn.md) | Web app: migrate from Material UI to Tailwind CSS + shadcn/ui | Accepted |
