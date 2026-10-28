# GitHub Org & Project Setup

A ready-to-apply proposal for when the repos move to the organization. Adjust names to taste.

## Repositories
| Repo | Notes |
|---|---|
| `pokesandbox` | Monorepo (bot, webapp, shared, future `libs/engine`) |
| `pokemon-showdown` → consider renaming to `pokesandbox-showdown` | Fork: upstream + patch set + mods. Track upstream with a scheduled sync PR. |
| `flowcord` (already standalone) | Multi-user flows are a Phase 1 dependency. Cross-link issues. |

## Issue types (org-level)
`Epic` · `Feature` · `Task` · `Bug` · `Spike` (time-boxed research with a written outcome) · `Decision` (records an architecture decision; links to the concept doc)

Use **sub-issues** for Epic → Feature/Task.

## Labels
| Group | Labels |
|---|---|
| Area | `area:engine`, `area:bot`, `area:webapp`, `area:shared-models`, `area:battle`, `area:showdown-fork`, `area:authoring`, `area:infra`, `area:docs` |
| Domain | `domain:world`, `domain:scripts`, `domain:conditions-effects`, `domain:progression`, `domain:encounters`, `domain:npcs-trainers`, `domain:catalog`, `domain:character`, `domain:economy`, `domain:transport`, `domain:rules` |
| Phase | `phase:0-foundations`, `phase:1-arena`, `phase:2-mvp`, `phase:3-full`, `phase:4-sky` |
| Flags | `good first issue`, `help wanted`, `needs-decision`, `blocked`, `breaking-change`, `agent-ready` |

## Milestones
Create M0–M6 exactly as in [`mvp.md`](mvp.md). Phase 3/4 items go into the backlog without milestones until MVP ships.

## Project (Projects v2) fields
| Field | Type | Values |
|---|---|---|
| Status | single select | Backlog · Ready · In Progress · In Review · Done |
| Priority | single select | P0 (blocks milestone) · P1 · P2 |
| Size | single select | S · M · L · XL |
| Phase | single select | 0 · 1 · 2 · 3 · 4 |
| Area | single select | mirrors `area:*` |
| Track | single select | Battle · Authoring · Adventure · Platform |

**Views:**
- Board by Status (filtered to the current milestone).
- Roadmap (timeline) by Milestone.
- Table grouped by Epic.
- "Decisions" (type = Decision, open first).

## Seeding order
1. Create **Decision** issues for Q15–Q22 in [`../architecture/open-questions.md`](../architecture/open-questions.md), each linking its concept doc. Close each with the decision.
2. Create **Epics** from `mvp.md` (one per bold "Epic:" heading, plus one per M2–M6 milestone).
3. Create child issues from the checklists. Use the existing issue templates (`data_model_request.yml` fits the model issues; `bot_feature_request.yml` fits menu work).
4. Tag `good first issue` on small, well-specified items (indexes, labels, predicates once the registry exists, item seed data, templates).

## Team & workflow (decided Oct 2026, Q29)
- **Team:** owner (senior), possibly a second senior (commitment TBD), 2 junior-to-mid devs, plus AI agents.
- **Backlog shape:** epics plus self-contained issues, every one attributed to a **milestone**.
- **Review:** every PR needs the owner's review (`CODEOWNERS` = owner). Add the second senior to `CODEOWNERS` for their areas if they commit. Because review is the bottleneck, keep issues small enough for one focused PR.
- **Scheduled agent workflow:** a scheduled job may pick up the next available, highest-priority issue. For that to be safe, issues need machine-readable readiness:
  - Label **`agent-ready`**, applied only when the issue has clear acceptance criteria, links to its concept doc, and no open `needs-decision`.
  - **Priority** (P0–P2) and **Milestone** set. The job picks the highest-priority `agent-ready`, unassigned, **unblocked** issue in the **current milestone**. Use GitHub issue dependencies ("blocked by") to mark blockers.
  - The job **assigns itself before starting** (to avoid double pickup), opens **one PR per issue** linking it, and never picks `Decision`/`Spike` issues or anything labeled `needs-decision`.
  - Agent PRs follow `agents.md` + `copilot-instructions.md`, updated with the architecture rules from these docs. They go through the same owner review.

## Issue template additions (suggested)
- `decision.yml`: Context, Options (with pros/cons), Recommendation, Decision, Consequences. Mirrors the concept-doc format so ADRs stay lightweight.
- `spike.yml`: Question, Time box, Findings, Recommendation, Follow-up issues.
