# Sahaara

Hindi-first NGO donation platform with a women's schemes finder, eligibility finder, 3-step donation flow with instant 80G receipt PDF, and a trust admin CMS.

Built with Next.js 16, React 19, Prisma 7, PostgreSQL, and Tailwind 4.

## Quick start (Docker)

Requires Docker Desktop with Compose v2.

```bash
docker compose up --build
```

Open <http://localhost:3000/hi>. The stack waits for PostgreSQL, applies migrations, seeds the 12 schemes and demo receipts, then starts the app. The first build takes a few minutes.

Default demo logins (override them in `.env` before starting if needed):

- Admin: `admin@example.org` / `demo-admin-password`
- Donor email: `donor@example.org`
- Demo OTP: `123456`

Useful commands:

```bash
docker compose down          # stop the stack
docker compose down -v       # stop and delete the demo database
docker compose logs -f app   # follow app logs
APP_PORT=3002 DB_PORT=5435 docker compose up --build   # avoid port clashes
```

The app listens on `3000` and PostgreSQL on `5433`. Compose reads `.env`, but always points the containers at the `db` service instead of `localhost`.

## Publish images to GHCR

Pushing to `main` or a `v*` tag runs `.github/workflows/docker-publish.yml`, which publishes:

- `ghcr.io/jagdep-singh/sahaara-app`
- `ghcr.io/jagdep-singh/sahaara-migrator`

After the first publish, set both packages to **public** in GitHub Packages so reviewers can pull them without logging in. Then run:

```bash
docker compose -f docker-compose.release.yml up -d
```

Override `SAHAARA_IMAGE_PREFIX`, `SAHAARA_IMAGE_TAG`, `APP_PORT` or `DB_PORT` as needed.

## Local development

```bash
docker compose up -d db
npm install
cp .env.example .env
npm run db:deploy
npm run db:seed
npm run dev
```

The test database is optional and uses port `5434`:

```bash
docker compose --profile test up -d db_test
```

## Tests

```bash
npm run typecheck
npm run lint
npm test
npx playwright test
```

To run the browser tests against the Docker stack:

```bash
E2E_BASE_URL=http://localhost:3000 npx playwright test
```

## Documentation

- [`deployment.md`](./deployment.md) — Docker, GHCR, Vercel + Neon, environment variables, demo script.
- `docs/TDD-facts.md` — architecture, flows, testing, accessibility and performance results.
- `docs/loadtest-results.md` — measured receipt-numbering load test.
- `docs/HINDI-REVIEW.md` — Hindi copy review worksheet.
