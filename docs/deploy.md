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
and installs the cert. That is normal. A `526` that persists past a few minutes
means no certificate is being issued — check the proxy logs.

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

<!-- TODO: record which Coolify project this resource lives in. It was an open
     question on 2026-08-10 and the answer belongs here. -->
