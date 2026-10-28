# 21: Hosting & Environments

> **TL;DR (proposed Oct 2026):** Keep cost near zero apart from one small VPS.
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

**Note on Postgres:** a Postgres container would mean reopening the database decision (Q33, MongoDB chosen). If cost alone ever pushes toward Postgres, the comparison should be against *managed* Postgres free tiers (e.g. Neon, Supabase), not a self-run container. That's a revisit for the Phase 3 checkpoint, not now.

**Proposed path:**
1. **MVP (your server only):** VPS (~$5–20) + Atlas Free + nightly `mongodump` to free object storage. Roughly **$5–20/month total.**
2. **Before opening to other servers:** move to **Atlas Flex** for managed daily snapshots (keep the nightly dump as a second copy). Roughly **$15–50/month total.**
3. **Only if growth demands it:** M10 (~$60–85).

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
