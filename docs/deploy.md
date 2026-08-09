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

## Coolify setup

1. New resource → **Dockerfile** (not Nixpacks — the Dockerfile is committed).
2. Source: `github.com/kylegrover/terminimator`, branch `main`.
3. Domain: `https://terminimator.ufffd.com`. Coolify handles the TLS cert.
4. Port: **80**.
5. No environment variables. No database. No secrets. This app has no backend —
   every sketch's state rides in the `?s=` query parameter and never reaches
   the server.
6. DNS: `A`/`CNAME` for `terminimator` on `ufffd.com` → the VPS. Set it
   **DNS only** in Cloudflare, not proxied, so Coolify can issue the cert.

Health check is built into the Dockerfile and hits `/health.json`, which ships
from `public/`.

## Verify after deploy

```bash
curl -sI https://terminimator.ufffd.com/                # 200, security headers
curl -s  https://terminimator.ufffd.com/health.json     # {"status":"ok",...}
curl -sI https://terminimator.ufffd.com/assets/         # immutable cache header
```

Then load a sketch, share the URL, and open it in a private window — that round
trip is the one thing the health check cannot prove.

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
