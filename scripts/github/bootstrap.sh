#!/usr/bin/env bash
# Bootstraps GitHub labels, milestones, and the Projects v2 board described in
# docs/roadmap/github-project-setup.md. Safe to re-run (existing items are skipped).
#
# Requires: gh (authenticated with repo + project scopes: `gh auth refresh -s project`), jq.
#
# Usage:
#   scripts/github/bootstrap.sh labels     <org>/<repo>
#   scripts/github/bootstrap.sh milestones <org>/<repo>
#   scripts/github/bootstrap.sh project    <org> "<project title>"
#   scripts/github/bootstrap.sh add-issues <org> <project-number> <org>/<repo> <issue-number>...
set -euo pipefail

cmd="${1:-}"; shift || true

label() { # repo name color description
  gh label create "$2" --repo "$1" --color "$3" --description "$4" 2>/dev/null \
    && echo "created label: $2" || echo "exists: $2"
}

case "$cmd" in
  labels)
    repo="$1"
    for a in engine bot webapp shared-models battle showdown-fork authoring infra docs; do
      label "$repo" "area:$a" "1d76db" "Area: $a"
    done
    for d in world scripts conditions-effects progression encounters npcs-trainers catalog character economy transport rules; do
      label "$repo" "domain:$d" "5319e7" "Domain: $d"
    done
    label "$repo" "phase:0-foundations" "c5def5" "Phase 0: foundations"
    label "$repo" "phase:1-arena"       "c5def5" "Phase 1: Arena (pre-MVP)"
    label "$repo" "phase:2-mvp"         "c5def5" "Phase 2: MVP"
    label "$repo" "phase:3-full"        "c5def5" "Phase 3: full feature build"
    label "$repo" "phase:4-sky"         "c5def5" "Phase 4: pie in the sky"
    label "$repo" "good first issue"    "7057ff" "Good for newcomers"
    label "$repo" "help wanted"         "008672" "Extra attention is needed"
    label "$repo" "needs-decision"      "d93f0b" "Blocked on an owner decision"
    label "$repo" "blocked"             "b60205" "Blocked by another issue or external factor"
    label "$repo" "breaking-change"     "e99695" "Changes stored data or public contracts"
    label "$repo" "agent-ready"         "0e8a16" "Clear acceptance criteria; eligible for the scheduled agent"
    ;;

  milestones)
    repo="$1"
    while IFS='|' read -r title desc; do
      if gh api "repos/$repo/milestones?state=all&per_page=100" --jq '.[].title' | grep -Fxq "$title"; then
        echo "exists: $title"
      else
        gh api "repos/$repo/milestones" -f title="$title" -f description="$desc" >/dev/null && echo "created milestone: $title"
      fi
    done <<'MS'
M0a: Platform & Arena Foundations|Org/CI, library skeletons + boundaries, persistence basics
M0b: Content Foundations|Conditions/gates, effects, content keys, authoring layer, region releases
M1: Battle Core & Catalog|Showdown fork modernization, catalog import, team presets, BattleService, AI
M2: Arena Release|Public PvP/PvAI in Discord, plus launch readiness (hosting, backups, deploys, monitoring, staging)
M3: World Authoring|Locations, encounters, transport, shops, rules, validation, webapp editors
M4: Interaction Engine|Scripts, triggers, NPCs, trainers, templates
M5: Adventure Core|Characters, travel, explore, battles, party/PC/bag, progression, adventure log
M6: Kanto Classic & MVP Release|Kanto Classic template, playtest, release
MS
    ;;

  project)
    org="$1"; title="$2"
    num=$(gh project create --owner "$org" --title "$title" --format json --jq '.number')
    echo "created project #$num"
    gh project field-create "$num" --owner "$org" --name "Priority" --data-type SINGLE_SELECT --single-select-options "P0,P1,P2"
    gh project field-create "$num" --owner "$org" --name "Size"     --data-type SINGLE_SELECT --single-select-options "S,M,L,XL"
    gh project field-create "$num" --owner "$org" --name "Phase"    --data-type SINGLE_SELECT --single-select-options "0,1,2,3,4"
    gh project field-create "$num" --owner "$org" --name "Area"     --data-type SINGLE_SELECT --single-select-options "engine,bot,webapp,shared-models,battle,showdown-fork,authoring,infra,docs"
    gh project field-create "$num" --owner "$org" --name "Track"    --data-type SINGLE_SELECT --single-select-options "Battle,Authoring,Adventure,Platform"
    echo "Status is a built-in field: set its options to Backlog, Ready, In Progress, In Review, Done in the project settings."
    echo "Create the views (Board by Status, Roadmap by Milestone, Table grouped by parent issue) in the UI."
    ;;

  add-issues)
    org="$1"; num="$2"; repo="$3"; shift 3
    for n in "$@"; do
      gh project item-add "$num" --owner "$org" --url "https://github.com/$repo/issues/$n" >/dev/null && echo "added #$n"
    done
    ;;

  *)
    sed -n '2,12p' "$0"; exit 1 ;;
esac
