# 21: Hosting & Environments

> **Update (Oct 2026):** the owner prefers a **managed host to start** (Railway/Fly/Render class), and may get discounted or free hosting through a developer's family host. The VPS notes below remain as the self-managed alternative.
>
> **TL;DR (original proposal):** Keep cost near zero apart from one small VPS.
> - **VPS** (self-managed, Docker Compose) runs the bot, engine, battle service, and webapp behind Caddy.
> - **MongoDB Atlas free cluster** stores data. It's a replica set, so transactions work.
> - **Nightly `mongodump`** goes to free-tier object storage.
> - **GitHub Actions** deploys. **Sentry's free tier** catches errors.
> - **Staging is a second, lightweight Compose stack on the same VPS** with its own test bot, not separate infrastructure.

**MVP impact:** High (M0a) · **Cost to change later:** Low (everything is containerized and behind env config)

## Constraints
- **Budget:** pay for hosting only. The project is non-commercial: donations are optional and not relied on, and it's not-for-profit because the content is Nintendo/Game Freak IP.
- **Workload:** an always-on Discord gateway connection plus in-memory live battles. **Serverless doesn't fit.** The bot needs a long-running process.
- **Data:** MongoDB replica set (transactions for battle results, trades, and publishing) and **real backups** (player saves).
- **Existing accounts:** MongoDB only.

## Proposed setup

| Piece | Where | Cost |
|---|---|---|
| Bot + engine + BattleService | VPS, Docker container | VPS cost (one small instance) |
| Next.js webapp | Same VPS, Docker container | — |
| Reverse proxy + TLS | Caddy (automatic HTTPS) on the VPS | free |
| Database | **Atlas free cluster** (a replica set, 512 MB). Databases: `prod`, `staging`. | free |
| Backups | Nightly `mongodump` from the VPS → object storage free tier (e.g. Cloudflare R2), with 14–30 day retention | free tier |
| CI/CD | GitHub Actions: tests on PR; `main` → staging stack; version tag → prod stack (SSH + `docker compose pull && up -d`) | free for public repos |
| Errors / uptime | Sentry free tier + a free uptime monitor | free |
| Later | Sprite mirror on object storage; Redis when sharding | — |

Check current pricing and plan terms before committing. Free-tier limits change, and some have non-commercial clauses. **Upgrade Atlas** to a paid tier with built-in backups when real data volume or player count justifies it. The free cluster's limits (storage, connections, no automated backups) are fine for an owner-server MVP.

## Cost comparison (researched Oct 2026; verify before buying)
**Database**
| Option | Rough monthly cost | What you get |
|---|---|---|
| Atlas **Free** (M0) | $0 | 512 MB, shared, replica set (transactions), **no backups** (do your own `mongodump`) |
| Atlas **Flex** | ~$8–30 (hourly, capped at $30) | Up to ~5 GB, ops/sec limit, **one daily snapshot** (no point-in-time restore) |
| Atlas **M10** dedicated | ~$57–60 + backup storage (~$75–85 realistic) | Dedicated 3-node replica set, automatic failover, continuous backups + point-in-time restore, performance advisor |
| DB container on a managed app host (Railway/Fly/Render) | ~$5–15 + volume storage | **A container, not a managed database:** single node, no failover. You configure the replica set, backups, and upgrades yourself. |
| DB container on your own VPS | $0 extra (shares the VPS) | Same as above, plus the VPS's resources are shared with the bot |

**App hosting (bot + engine + webapp; plan for ~2–4 GB RAM total)**
| Option | Rough monthly cost | Notes |
|---|---|---|
| Unmanaged VPS | ~$5–20 depending on provider/size | Hetzner raised cloud prices twice in 2026 (e.g. CPX22 €7.99 → €19.49 from June; its cheapest tier is often unavailable), so compare providers |
| Fly.io | ~$3.69 per always-on 512 MB machine; ~$7–15 for realistic sizes | Usage-based, no free tier, RAM price increased Oct 2026 |
| Railway | $5 Hobby (includes $5 usage) + overage; realistic ~$5–15 | Usage-based (~$20/vCPU-month, ~$10/GB-month RAM) |
| Render | $7 per Starter service (512 MB), so ~$14+ for bot + web | 512 MB is tight for the bot + Showdown; the next size up costs more |

**Atlas paid vs a database container on a managed host.** What the paid Atlas tier buys is mostly what a container *doesn't* give you: automatic backups (daily snapshot on Flex; continuous + point-in-time restore on M10), replica-set failover (M10), engine upgrades, monitoring and index advice, encryption, and support. A database container on a managed host is still self-operated: the host keeps the container running, but data safety is yours. For player saves, the managed backups are the real value.

**Managed Postgres vs managed Mongo at similar cost (researched Oct 2026; indicative, verify before buying):**
| Option | Rough monthly cost | Backups | Notes |
|---|---|---|---|
| **Atlas Flex** (Mongo) | ~$8–30 (capped at $30) | One daily snapshot | Up to ~5 GB. Ops/sec cap. No code changes. |
| **DigitalOcean Managed MongoDB** | ~$15.23 (1 GiB / 1 vCPU, single node); ~$45.68 as a 3-node replica | Daily backups bundled | Extra storage ~$0.20–0.215/GiB-month. No code changes. |
| DigitalOcean Managed Postgres | ~$15 (1 GB / 10 GB) | Daily backups included | HA roughly doubles the price |
| Supabase Pro (Postgres) | ~$25 base + compute/usage | Daily backups | Free tier pauses when idle |
| Neon (Postgres) | Usage-based; ~$15 intermittent, ~$23 small always-on | History-based restore | Highest per-GB storage rate |
| Render Postgres | ~$6 to ~$22 depending on size (sources conflict) | Not confirmed | |

**Takeaway:** managed Postgres isn't cheaper than managed Mongo at this size. Both start around $15/month with daily backups (DigitalOcean offers both), and Atlas Flex is in the same range. The expensive Mongo option is Atlas *M10* (~$57+), which we don't need until thousands of players. So cost isn't a reason to reopen Q33. Moving to Postgres would cost engineering time (rewriting models, DTOs, seeds, conventions) for no savings.

**Revised database path:** Atlas Free (MVP, your server, plus nightly dumps) → **Atlas Flex or DigitalOcean Managed MongoDB (~$15)** before opening to other servers → a 3-node replica / M10 only if growth demands it.


**Proposed path:**
1. **MVP (your server only):** VPS (~$5–20) + Atlas Free + nightly `mongodump` to free object storage. Roughly **$5–20/month total.**
2. **Before opening to other servers:** move to **Atlas Flex** for managed daily snapshots (keep the nightly dump as a second copy). Roughly **$15–50/month total.**
3. **Only if growth demands it:** M10 (~$60–85).

## Storage sizing & data retention (estimates, Oct 2026)
Atlas tiers: **Free = 512 MB**, **Flex = up to ~5 GB**, **M10 = 10 GB** default storage (2 GB RAM, ~$57–60/month plus backup storage). Storage counts data **and indexes**. Free and Flex also cap **throughput** (ops/sec), which may bind before storage does.

| Data | Size estimate | Notes |
|---|---|---|
| Catalog (species, moves, learnsets, items) | **~10–20 MB** (measured: 1,371 dex entries ≈ 3.7 MB JSON; Showdown's learnsets ≈ 3.5 MB and moves + move text ≈ 1 MB as source) | Moves and learnsets live in the DB catalog (overrides, custom learnsets, TM/HM assignment, move details). Per-gen variants add a little. Sprites are URLs. |
| Region draft content (Kanto-sized) | ~1–3 MB per region | Locations, NPCs, trainers, scripts, encounter tables |
| Region releases | ~1–3 MB each uncompressed, ~0.2–0.5 MB **gzip-compressed** | **Must have a retention policy**: keep the last N plus any referenced by characters/clones/templates |
| Character | ~5–20 KB | Flags grow over a playthrough |
| Pokémon instances | ~0.5–1 KB each; 50–300 per engaged player | ≈ 50–300 KB per player at endgame |
| Battle records (seed + input log) | ~5–20 KB per battle | **Biggest risk.** 100 players × 30 battles/day × 10 KB ≈ 30 MB/day without cleanup |
| Adventure log (permanent) | ~0.5–2 KB per entry; ~5–15 KB/day per active player with wild rollups | ≈ 0.2–0.5 GB/year for 100 active players (see [22](22-adventure-log-and-narration.md)) |

**Retention rules (needed for any tier):**
- **Opponent Pokémon are ephemeral:** created from recipes for the battle, gone afterwards unless caught.
- **Full battle records:** adventure battles are compressed after the battle and kept for a 7-day support window, then deleted (PvP/Arena per the replay policy). The **permanent adventure log** keeps a compact summary (with turn digests for trainer battles) forever. See [22](22-adventure-log-and-narration.md).
- **Wild battles roll up** into one log entry per visit. Catches, trainer battles, milestones, and evolutions get their own entries.
- **Debug-level events** go to application logs, not Mongo (or a short TTL index, e.g. 48h).
- **Releases:** gzip-compress, keep the last ~10 per region plus every release still referenced (characters on it, clone bases, template versions).

**When the limits bite (rough, with retention in place):**
| Stage | Data | Throughput | Tier |
|---|---|---|---|
| MVP on your server (≤ ~100 players) | ~50–150 MB | Low | **Free** is fine |
| Early public (several servers, ~1,000 players) | ~0.3–1 GB | Hundreds of ops/sec at peaks | **Flex** |
| Growing (~5–10k players) | ~2–5 GB | Approaching Flex's ops/sec cap | **M10** |

**Without** the retention rules, battle and event logs alone could fill the free tier within weeks, even on one server.

## Self-managed VPS: what you take on
| Area | What it means in practice | Mitigation |
|---|---|---|
| **Security** | You own OS patching, SSH, and firewall. An unpatched box is the main real-world risk. | Key-only SSH (no root/password login), `ufw` allowing 22/80/443 only, `unattended-upgrades`, fail2ban. Never expose Mongo or app ports publicly. |
| **TLS & proxy** | Certificates, renewals, routing | Caddy does automatic HTTPS with one small config file |
| **Process supervision** | Restarting crashed services, starting on reboot | Docker `restart: unless-stopped`. The engine is restart-safe by design (persisted modes, battle recovery). |
| **Deploys** | Repeatable, rollback-able releases | Images built in CI, pushed to GitHub Container Registry, pulled by tag. Rollback = deploy the previous tag. |
| **Secrets** | Bot tokens, DB URIs, OAuth secrets | `.env` files outside the repo (root-only permissions) or GitHub Actions secrets injected at deploy. Separate tokens per environment. |
| **Disk & logs** | Logs or images filling the disk and taking the bot down | Docker log rotation (`max-size`), periodic `docker image prune`, a disk-usage alert |
| **Backups** | Untested backups are not backups | Nightly dump + **a restore drill** before launch and periodically (restore into the staging DB) |
| **Monitoring / on-call** | Nobody notices an outage at 3am | Uptime check + Sentry alerts to your phone/Discord. Accept best-effort uptime for a hobby project. |
| **Single point of failure** | One box; if it dies, everything is down | Everything is reproducible from the repo (Compose + provisioning notes/script), and data lives in Atlas, so rebuilding a VPS is an hour, not a disaster |

Keeping the **database managed (Atlas)** removes the hardest self-hosting parts (replica sets, durability, upgrades). The VPS only runs stateless containers.

## Environments
| Env | Purpose | Infra |
|---|---|---|
| **dev** | Each developer locally | Docker Compose (Mongo replica set container), personal dev bot token + test guild |
| **staging** | Integration check of `main` before prod; release-migration rehearsals | **Second Compose stack on the same VPS**, its own test Discord bot + test guild, Atlas `staging` database |
| **prod** | Your server's real players | Prod Compose stack, prod bot token, Atlas `prod` database |

**Is staging necessary?** Not as separate infrastructure. As a second stack on the same box it costs nothing extra and earns its keep for three things:
1. **Data migrations:** restore last night's prod dump into staging and run the new release against it before tagging. This is where breaking a live save gets caught.
2. **Discord-specific behavior** (command registration, permissions, Components v2 layouts) that local dev can miss.
3. **Agent PRs:** merged `main` lands somewhere real before your prod tag.

If even that feels heavy for the first weeks, start with dev + prod, and add the staging stack before the Arena goes public.

## Open questions
- Self-managed VPS vs a managed container host (Railway/Fly/Render): see the trade-offs above. Recommendation: VPS, given the low budget and your interest, with Atlas keeping the hard data parts managed.
- Do donations change anything legally? Not legal advice, but keep donations transparently tied to hosting costs only, and avoid anything resembling sales or paid perks, to stay clearly non-commercial.
