# Backlog Drafts

Issue drafts reviewed here before they're created in GitHub. Once created, the issue is the source of truth, and the mapping table below records where each draft went.

| File | Milestone |
|---|---|
| [`m0a-platform-arena-foundations.md`](m0a-platform-arena-foundations.md) | M0a: Platform & Arena Foundations |
| [`m0b-content-foundations.md`](m0b-content-foundations.md) | M0b: Content Foundations |
| [`m2-launch-readiness.md`](m2-launch-readiness.md) | M2: Arena Release (launch-readiness epic only, so far) |
| *(M1, the rest of M2, and M3–M6 drafted once M0a is underway)* | |

## Format
Each issue is a `###` heading with a **stable draft ID** (`M0A-07`, `M0B-12`) followed by a field line, then the body.

```
### M0A-07 · Title
`Type: Task` · `Parent: E-M0A-1` · `Priority: P1` · `Size: M` · `Labels: area:bot` · `Blocked by: M0A-04` · `agent-ready: yes` · `Owner: junior`
```

| Field | Values / meaning |
|---|---|
| ID | `E-<MS>-n` = epic. `<MS>-nn` = child issue. IDs are only for drafting and cross-references before GitHub numbers exist. |
| Type | `Epic`, `Feature` (user-visible), `Task` (internal) |
| Parent | The epic the issue becomes a sub-issue of |
| Priority | `P0` blocks the milestone · `P1` needed for the milestone · `P2` nice to have |
| Size | `S` ≤ 1 day · `M` 2–4 days · `L` 1–2 weeks (consider splitting) |
| Blocked by | Draft IDs. Becomes GitHub "blocked by" dependencies. |
| agent-ready | `yes` = clear acceptance criteria, concept-doc links, no open decision. Eligible for the scheduled agent. `no` = needs owner/senior design judgement or account access. |
| Owner | Suggested only: `owner`, `senior`, `junior`, `agent`, or `any` |

Bodies use **Summary**, **Acceptance criteria**, and **Refs** (concept docs). Acceptance criteria are written so a reviewer can check them from the PR alone.

## Creating issues
1. The owner reviews and edits these files (this PR).
2. Org setup: transfer repos, install the Claude GitHub App on the org, create the project.
3. The owner runs [`scripts/github/bootstrap.sh`](../../scripts/github/bootstrap.sh): `labels`, `milestones`, and `project`.
4. Claude creates epics, then child issues (types, milestones, labels, sub-issue links, blockers) and fills in the mapping below.
5. The owner runs `bootstrap.sh add-issues` with the created issue numbers, then sets the Priority/Size/Status fields (or asks Claude to list them per issue).

## Mapping (draft ID → GitHub issue)
| Draft ID | Issue |
|---|---|
| *(filled in on creation)* | |
