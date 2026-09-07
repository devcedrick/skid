# 🏠 Skid Vault - Map of Content

> Vault index for `docs/`. Start here.

---

## Core notes

- [[PROJECT]] — vision, features, tabs (Today / Schedule / Settings), structure, AI JSON format.
- [[REQUIREMENTS]] — FR-1..FR-8, non-functionals, constraints, out of scope.
- [[DATA_MODEL]] — TS + SQLite contracts, AI JSON → DB mapping, query contracts.
- [[ARCHITECTURE]] — module map: `app/` routes → `src/` (ocr → ai → review → storage → notifications).
- [[TASKS]] — build-ordered checklist derived from FR-1..FR-8.
- [[UI_GUIDELINES]] — styling rules + color tokens for visual consistency.

## Dynamic notes

- [[DECISIONS]] — ADR index (records live in `adr/`).
- [[CHANGELOG]] — code + release history; `[ADR-XXXX]` refs carry the why.

---

> Conventions: flat `docs/*.md`, `UPPERCASE.md` names, `[[wikilinks]]` + footer backlinks. Tags via frontmatter `tags:`.
> Vault rule: core concepts stay flat in `docs/`; decision records go in `docs/adr/`. Core notes are `accepted` (frozen — change via new ADR); TASKS / DECISIONS / CHANGELOG are living.
