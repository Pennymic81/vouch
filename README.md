# Vouch

An agreed plan. Checked work. Guaranteed pay.

Vouch links business owners who aren't technical with proven developers and AI engineers. AI writes the project plan, matches are based on shipped work, and every milestone is QA-checked before escrow releases payment.

## Run it

```bash
npm install
cp .env.example .env   # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run dev            # http://localhost:3000
npm run build          # production build
```

The SQLite database (`vouch.db`) is created and migrated automatically on first run.

## Accounts (step 2)

- Email + password sign-up and sign-in with [Better Auth](https://better-auth.com), stored with [Drizzle ORM](https://orm.drizzle.team)
- Two roles chosen at sign-up: **business owner** (`client`) and **developer / AI engineer** (`developer`)
- Business-owner pages (`/projects/*`) and the developer dashboard (`/dashboard`) require the right role; signed-out visitors go to `/signin` and come back afterwards
- Roles are checked on the server and by a database constraint, and can't be changed after sign-up
- Database schema: `src/db/schema.ts` · migrations: `drizzle/` (`npx drizzle-kit generate` after schema changes)

## Tests

End-to-end tests run in Playwright on desktop (1440px) and phone (Pixel 7) sizes:

```bash
npx playwright install chromium   # first time only
npm test                          # builds, starts the app, runs every test
npm run test:ui                   # interactive runner
```

- `tests/pages.spec.ts` — every page loads, has its heading and title, no console errors, no sideways scrolling, 404 works
- `tests/auth.spec.ts` — sign-up per role, duplicate emails, password rules, sign-in/out, wrong passwords, protected pages, role separation, safe redirects, forged cookies
- `tests/flows.spec.ts` — business-owner journey, milestone approve / request changes / undo, sign-up routing and validation, desktop and phone menus, FAQ
- `tests/accessibility.spec.ts` — axe WCAG 2.1 A/AA scan of every page, one h1 per page, tap-target sizes on phones

GitHub Actions runs lint and the full suite on every push and pull request.

## Pages (step 1 — UI)

| Route | Page |
|---|---|
| `/` | Landing page |
| `/signup` | Sign up (business owner or developer) |
| `/signin` | Sign in |
| `/projects/new` | AI scoping — idea → plan with milestones |
| `/projects/new/matches` | Matched developers with "why they fit" |
| `/projects/support-chatbot` | Client project workspace (QA review, escrow, change requests) |
| `/dashboard` | Developer dashboard |

Sample data lives in `src/lib/data.ts`. Values in brackets like `[YOUR FEE]` and `[AMOUNT]` are placeholders to set later.

## Structure

- `src/app/globals.css` — Vouch colors and fonts (Tailwind v4 `@theme`)
- `src/components/` — header, footer, logo, buttons, cards, pills, icons, stepper
- `src/lib/data.ts` — sample plan, candidates, invitations

## Next steps

2. ~~Accounts (business owner / developer roles)~~ ✓
3. Database — projects, milestones, matches (Postgres + Prisma)
4. AI scoping
5. Matching
6. Milestones & QA flow
7. Escrow payments
