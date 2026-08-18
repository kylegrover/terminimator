# Deploy

Target: **`terminimator.ufffd.com`**, as its own Coolify service on the VPS.

Static SPA — nginx serving Vite's `dist/`. Same shape as
`client-sites/groundcoverworks/groundcoverworks-com`, so the pattern is already
proven in production on this box.

## Why a subdomain and not `ufffd.com/tools/terminimator/`

`ufffd.com` already hosts `/tools/roomplanner/`, so a path would match the existing
convention — but it would mean reverse-proxying into the main ufffd.com site, and
Vite would need `base: '/tools/terminimator/'` set in `vite.config.ts` or every
asset URL breaks. As an independent Coolify service at a subdomain root, neither
applies. Revisit only if ufffd.com grows a real tools index worth unifying under.

Note that `ufffd.com`'s apex may still be served by Railway. That does not matter
here: a subdomain is its own hostname and can point at the VPS independently.
Mixed origins within one Cloudflare zone are normal.

## Coolify setup

1. New resource → **Dockerfile** (not Nixpacks — the Dockerfile is committed).

   ⚠️ **This is the step that actually broke the first deploy (2026-08-18).**
   Coolify defaulted the resource to **Nixpacks**, which ignores the committed
   Dockerfile entirely and autodetects a Node app instead. It then pinned Node
   **22.11.0**, and `vite@8` requires `^20.19.0 || >=22.12.0` — a miss by 0.0.1
   — after which `rolldown` failed to load its native binding
   (`rolldown-binding.linux-x64-gnu.node`, the npm optional-deps bug
   npm/cli#4828). The build died and **no container was ever produced.**

   Our Dockerfile builds on `node:24-alpine` with `npm ci`, which sidesteps both
   problems. If you see `Generating nixpacks configuration` in the deploy log,
   stop — the build pack is wrong, and nothing downstream of it will make sense.
2. Source: `github.com/kylegrover/terminimator`, branch `main`.
3. Domain: `https://terminimator.ufffd.com`.
4. Port: **80**.
5. No environment variables. No database. No secrets. This app has no backend —
   every sketch's state rides in the `?s=` query parameter and never reaches
   the server.
6. DNS: `A` record for `terminimator` on `ufffd.com` → the VPS, set
   **Proxied (orange cloud)**.

Health check is built into the Dockerfile and hits `/health.json`, which ships
from `public/`.

## Certificates: proxied from the start, via DNS-01

**Do not grey-cloud this record.** As of 2026-08-10 the server's Traefik issues
Let's Encrypt certificates through the **DNS-01 challenge** using a scoped
Cloudflare API token, so it never needs inbound port 80 and works fine while the
record is proxied. Earlier revisions of this file said to use DNS-only so the
HTTP-01 challenge could reach the origin; that is obsolete and following it now
just costs you a pointless toggle.

Because the `ufffd.com` zone is on **Full (strict)**, expect `526` for the first
minute or two after the resource is created, until Traefik finishes the challenge
and installs the cert. That is normal.

**A `526` that persists is more ambiguous than it looks, and this cost us real
time.** Traefik serves its **default self-signed certificate** whenever *no route
matches the hostname* — which produces a `526` identical to a genuine cert
failure. So a persistent `526` means *any* of: the resource was never created,
the build failed so no container exists, or the cert genuinely didn't issue. All
three looked the same from outside, and origin :443 is firewalled to Cloudflare's
ranges, so none of it is inspectable from a dev machine.

**Read the deploy log first.** It distinguishes all three in seconds; guessing
from outside cannot distinguish them at all. In our case the answer was the
build pack (see Coolify setup step 1) and certificates were never involved.

If DNS-01 validation fails, raise
`--certificatesresolvers.letsencrypt.acme.dnschallenge.delaybeforecheck` from `0`
to `30` and restart the proxy. Do not retry blindly: Let's Encrypt caps failed
validations at 5/hour.

## Verify after deploy

```bash
curl -sI https://terminimator.ufffd.com/                # 200, security headers
curl -s  https://terminimator.ufffd.com/health.json     # {"status":"ok",...}
echo | openssl s_client -connect terminimator.ufffd.com:443 \
  -servername terminimator.ufffd.com 2>/dev/null | openssl x509 -noout -issuer
```

The issuer should be Let's Encrypt. Then load a sketch, share the URL, and open it
in a private window — that round trip is the one thing the health check cannot
prove.

## Gotchas

- **Never tested locally with Docker** — Docker Desktop was not running when this
  was written (2026-08-08). The `npm run build` half is verified; the image build
  is not. If Coolify's first build fails, that is the untested seam.
- **HSTS is on at `max-age=86400`.** It is scoped to this subdomain only — no
  `includeSubDomains`, deliberately, because the apex serves the main ufffd.com
  site. Do not add `includeSubDomains` or `preload` here without a domain-wide audit.
- **`X-Frame-Options: DENY`** blocks embedding. If terminimator sketches should be
  embeddable elsewhere, relax that line in `nginx.conf` on purpose.
- `.dockerignore` excludes `docs/` and `*.md`, so documentation never ships in the
  image — including this file.

## Coolify project

**The `ufffd` project**, on the VPS at `192.3.196.144`. Kyle moved the resource
there on 2026-08-18, alongside the other ufffd services. That server also runs
plenty of unrelated things — the `ufffd` project is the boundary that keeps this
one findable.

Answers the TODO open here since 2026-08-10. Note that "couldn't find it in
Coolify" was itself the symptom that revealed the app had never been deployed at
all, so keeping this recorded is not just bookkeeping.

## Status

**Live and verified 2026-08-18.** First successful deploy after switching the
build pack from Nixpacks to Dockerfile:

| Check | Result |
|---|---|
| `GET /` | `200` |
| `GET /health.json` | `{"status":"ok","service":"terminimator"}` |
| SPA fallback on a deep path | `200` |
| Security headers | all 6 present |

The six are `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
`Permissions-Policy`, `Cross-Origin-Opener-Policy`, and
`Strict-Transport-Security` — matching `nginx.conf` exactly. **There is no CSP**;
that is a deliberate absence rather than a regression, and would be the obvious
addition if this ever wants hardening.

The "never tested locally with Docker" seam noted above was also closed on
2026-08-17 by a real local build and run, before this deploy.

**Still unproven by any automated check:** load a sketch, share the URL, open it
in a private window. The `?s=` round trip is the actual product and no health
check touches it.
