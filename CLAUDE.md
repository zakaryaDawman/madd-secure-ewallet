# MADD: project rules

MADD is a secure Android e-wallet (Final Year Project, APU). It checks every transfer after login with 4 rules and asks the owner before anything unusual goes through. Full requirements and plan: `PLAN.md`. Task list: `docs/MADD-Build-Playbook.pdf`.

## Stack

- `mobile/`: React Native, Expo, TypeScript, Expo Router. **Android only.** Screens in `mobile/src/app/` (one file per screen), shared UI in `src/components/`, server calls in `src/api/`, design tokens in `src/theme/`. Add packages with `npx expo install`, and check the versioned Expo docs (see `mobile/AGENTS.md`).
- `server/`: routes in `src/routes/`, rules in `src/rules/`, DB in `src/db/`, tests in `test/`.
- `server/`: Node.js, Express, TypeScript.
- Database: PostgreSQL 16 in Docker (`docker-compose.yml`). Adminer viewer on http://localhost:8080.
- Push: Firebase Cloud Messaging (from task D7).
- Tests: Jest + Supertest (server).

## How we work

- One task from the playbook at a time. Show a short plan first; build only after the user says "go".
- Only touch files the task needs. Run the tests before saying a task is done.
- Commit once per task when the user asks. **Never add a Claude co-author line.**
- If a requirement is unclear, ask instead of guessing.

## Code style

- **One component per file**, named after the component (`MaddButton.tsx`).
- **One job per function.** Every function has a short `/** comment */` saying what it does.
- TypeScript everywhere, no `any`. Clear names over short names. No unused code.
- Keep files short. If a file grows past ~200 lines, split it.

## Security rules (do not break)

- **The server makes every trust decision (FR-10).** The app only displays results.
- Money is stored as **integer sen** (RM 1.00 = 100). Never floats.
- Transfers run in one DB transaction with `SELECT ... FOR UPDATE` on the wallets.
- Passwords and PINs are hashed with bcrypt. Never log or return them.
- The JWT carries the session id and device id. Sessions expire after 30 minutes and can be revoked.
- `security_events` is append-only (enforced by a DB trigger).
- Each detection rule is a **pure function** in `server/src/rules/` with its own test file. Thresholds live in `server/src/rules/config.ts`.
- Error messages must not reveal whether an email, phone or password exists.
- Secrets live in `.env` (never committed). `.env.example` lists the keys.

## Design

- Follow the MADD design exactly: `design/app-screens/01-Main.png` … `48-AdminFlagDetail.png` (canvas: https://claude.ai/artifact/JQc31UKX2krdVjffjEtHxB).
- Colours, font and spacing come from `mobile/src/theme/`. Don't hard-code new colours.
- Shared components: `MaddButton`, `MaddAppBar`, `MaddKeypad`, `MaddTabBar`.

## Running locally

```bash
docker compose up -d          # database + Adminer
cd server && npm run dev      # API on :3000
cd mobile && npm run android  # opens MADD in Expo Go on the USB phone
```
The phone reaches the server through `adb reverse tcp:3000 tcp:3000` (run by `npm run android`).
