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

## Projects (step 3)

Business owners create projects and build their plans, all saved in the database:

- `/projects` — every project with its status, budget and time
- `/projects/new` — describe the idea in plain words
- `/projects/[id]/plan` — add, edit, reorder and delete milestones; each has what "done" means (one check per line), an amount and days. Totals update as you go
- **Approve plan & find matches** publishes the plan (it's then locked) and opens `/projects/[id]/matches`
- `/projects/[id]` — the workspace with milestones, statuses and budget
- Every read and change checks the project belongs to the signed-in business owner; inputs are validated on the server with zod and backed by database constraints

Matches are still example developers until real matching (step 5).

## AI scoping (step 4)

On the plan page, **Write my plan with AI** reads the owner's description and drafts a summary, 3–6 milestones with testable "done" checks, prices and days, plus up to 3 clarifying questions. Answering them and pressing **Update plan with my answers** rewrites the plan.

- Uses the Anthropic API with structured output (`src/lib/ai/plan.ts`); set `ANTHROPIC_API_KEY` in `.env`
- Every AI result is validated before it's saved; amounts and days are rounded to whole numbers
- Rewrites replace the current milestones (after a confirmation) and are limited to 10 per project
- The owner can edit, reorder or delete any AI milestone afterwards
- Tests use a predictable stand-in (`AI_FAKE=1`), so they never call the real API

## Tests

End-to-end tests run in Playwright on desktop (1440px) and phone (Pixel 7) sizes:

```bash
npx playwright install chromium   # first time only
npm test                          # builds, starts the app, runs every test
npm run test:ui                   # interactive runner
```

- `tests/pages.spec.ts` — every page loads, has its heading and title, no console errors, no sideways scrolling, 404 works
- `tests/auth.spec.ts` — sign-up per role, duplicate emails, password rules, sign-in/out, wrong passwords, protected pages, role separation, safe redirects, forged cookies
- `tests/projects.spec.ts` — full journey from landing page to published plan, plan editing (add, edit, reorder, delete, totals), server-side validation, publishing rules, privacy between accounts
- `tests/ai.spec.ts` — AI writes a plan, answering its questions updates it, rewrites replace hand-made milestones, editing AI milestones, the 10-rewrite limit, locked after publishing
- `tests/flows.spec.ts` — milestone approve / request changes / undo, sign-up routing and validation, desktop and phone menus, FAQ
- `tests/accessibility.spec.ts` — axe WCAG 2.1 A/AA scan of every page, one h1 per page, tap-target sizes on phones

GitHub Actions runs lint and the full suite on every push and pull request.

## Pages

| Route | Page |
|---|---|
| `/` | Landing page |
| `/signup` | Sign up (business owner or developer) |
| `/signin` | Sign in |
| `/projects` | Your projects |
| `/projects/new` | Describe a new project |
| `/projects/[id]/plan` | Build the plan (milestones) |
| `/projects/[id]/matches` | Matched developers with "why they fit" |
| `/projects/[id]` | Project workspace |
| `/dashboard` | Developer dashboard |

Sample data lives in `src/lib/data.ts`. Values in brackets like `[YOUR FEE]` and `[AMOUNT]` are placeholders to set later.

## Structure

- `src/app/globals.css` — Vouch colors and fonts (Tailwind v4 `@theme`)
- `src/components/` — header, footer, logo, buttons, cards, pills, icons, stepper
- `src/lib/data.ts` — sample plan, candidates, invitations

## Next steps

2. ~~Accounts (business owner / developer roles)~~ ✓
3. ~~Projects and plans saved in the database~~ ✓
4. ~~AI scoping~~ ✓
5. Matching
6. Milestones & QA flow
7. Escrow payments
