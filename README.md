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

## AI scoping (step 4)

On the plan page, **Write my plan with AI** reads the owner's description and drafts a summary, 3–6 milestones with testable "done" checks, prices and days, plus up to 3 clarifying questions. Answering them and pressing **Update plan with my answers** rewrites the plan.

- Uses the Anthropic API with structured output (`src/lib/ai/plan.ts`); set `ANTHROPIC_API_KEY` in `.env`
- Every AI result is validated before it's saved; amounts and days are rounded to whole numbers
- Rewrites replace the current milestones (after a confirmation) and are limited to 10 per project
- The owner can edit, reorder or delete any AI milestone afterwards
- Tests use a predictable stand-in (`AI_FAKE=1`), so they never call the real API

## Matching (step 5)

- **Developers** fill in `/dashboard/profile`: headline, bio, rate, availability, skills, and "shipped work" proof links tagged with the skills they show
- **Projects** list the skills they need (the AI suggests them; owners can change them). Both sides use one shared skill list (`src/lib/skills.ts`)
- **Scoring** (`src/lib/matching.ts`, 0–100): up to 50 for listing the needed skills, up to 40 for proof showing them, up to 10 for more than one relevant piece of proof. Developers who aren't available or have no proof aren't matched; scores under 25 are hidden
- Each match explains itself: **why they fit** (which shipped work shows which skill) and **gaps**
- **Invitations**: owners invite matches; developers read the full plan at `/dashboard/invitations/[id]` and accept or decline. The first to accept joins the project (status → in progress) and other pending invitations close. Owners can withdraw pending invitations
- Invites are re-checked on the server, and invitations are only visible to the developer they were sent to

## Milestones & QA (step 6)

Each milestone moves through one path, enforced in one place (`src/lib/delivery.ts`):

```
planned ─fund─▶ funded ─submit─▶ in QA ─pass─▶ awaiting approval ─approve / auto─▶ paid
                   ▲               │ fail              │ owner requests changes
                   └──── changes requested ◀───────────┘   (developer fixes and resubmits)
```

- **Owner** (`/projects/[id]`) funds one milestone at a time, in order; sees each delivery, the QA report check by check, and approves or requests changes with a note
- **Developer** (`/dashboard/projects/[id]`) hands in each milestone with a note and an `https://` demo link, and sees QA notes and the owner's feedback
- **QA reviewers** (`/review`) are Vouch staff listed in `REVIEWER_EMAILS` (`*@domain` allowed). They mark every agreed check as passed or failed — a failed check needs a note — and can't review projects they're part of
- If the owner doesn't respond within `REVIEW_WINDOW_DAYS` (default 5) after QA passes, the milestone is approved automatically
- When every milestone is paid, the project is **completed**. Escrow amounts and an activity log are shown to both sides
- Payments are simulated until step 7

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
- `tests/matching.spec.ts` — profile and proof validation, profile strength, ranking with reasons and gaps, who is left out, invite → accept → joins project, decline, withdraw, top-10 with "show all", invitation privacy
- `tests/delivery.spec.ts` — fund → deliver → QA → approve → paid, QA failure and resubmission, owner change requests, auto-approval, completing a project, validation and order rules, reviewer access and conflicts, developer privacy
- `tests/flows.spec.ts` — desktop and phone menus, account menu, FAQ
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
| `/dashboard/profile` | Developer profile & shipped work |
| `/dashboard/invitations/[id]` | Read a plan and accept or decline |
| `/dashboard/projects/[id]` | Developer's project — hand in milestones |
| `/review` · `/review/[id]` | QA queue and review form (staff only) |

Values in brackets like `[YOUR FEE]` on the landing page are placeholders to set later.

## Structure

- `src/app/globals.css` — Vouch colors and fonts (Tailwind v4 `@theme`)
- `src/components/` — header, footer, buttons, cards, milestone cards, skill picker, delivery controls
- `src/lib/` — auth, projects, AI planning, matching, delivery rules
- `src/db/schema.ts` — database tables · `drizzle/` — migrations

Requires **Node 20–24** (`.nvmrc` pins 22); `npm install` stops with a clear message on other versions.

## Next steps

2. ~~Accounts (business owner / developer roles)~~ ✓
3. ~~Projects and plans saved in the database~~ ✓
4. ~~AI scoping~~ ✓
5. ~~Matching~~ ✓
6. ~~Milestones & QA flow~~ ✓
7. Escrow payments
