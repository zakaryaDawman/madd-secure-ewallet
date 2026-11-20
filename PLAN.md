# MADD: plan

## Goal

A secure mobile e-wallet that detects suspicious transactions in real time and protects users from fraud: it keeps checking after login, pauses unusual activity, explains why, and lets the owner decide.

## Functional requirements

| ID | Requirement | Task |
|---|---|---|
| FR-1 | Register an account with the minimum information to create a wallet | B1, B2 |
| FR-2 | Log in with credentials | B3 |
| FR-3 | View current wallet balance | B4 |
| FR-4 | Send funds to another registered user | B5, B6 |
| FR-5 | Receive funds from another registered user | B6, B8, D6 |
| FR-6 | Chronological transaction history | B7 |
| FR-7 | Verify identity with password/PIN before wallet functions | B3, B6 |
| FR-8 | Time-limited server session token; reject invalid, expired or missing tokens; revoke on logout or freeze | C1 |
| FR-9 | Record the device of each login attempt; keep known devices per user | C2 |
| FR-10 | All authentication and authorisation decisions on the server only | all |
| FR-11 | Flag transactions above the amount threshold | D1, D2 |
| FR-12 | Flag excessive transactions in a time window | D1, D2 |
| FR-13 | Flag logins from unrecognised devices | D1, D4 |
| FR-14 | Flag repeated failed logins in a time window | D1, D5 |
| FR-15 | Real-time notification when a rule fires; hold the transaction until the user confirms or rejects | D3, D6, D7 |
| FR-16 | Permanently record every triggered rule in a security log | D2 |
| FR-17 | Admin functions restricted to the Admin role | C3, E1 |
| FR-18 | Admin views all flagged transactions and logins | E2, E4 |
| FR-19 | Admin views the full security log | E3 |
| FR-20 | Customers can never reach admin functions | C3 |

## Detection rules (`server/src/rules/`)

| Rule | Fires when | What happens |
|---|---|---|
| R1 Large amount | amount > max(RM 500, 3 × user's average transfer) | Transfer held for the owner's OK |
| R2 Velocity | more than 3 transfers in 5 minutes | Transfer held for the owner's OK |
| R3 Unknown device | login from a device not in trusted devices | Device untrusted; its transfers wait for a trusted device |
| R4 Failed logins | 5 failed logins in 15 minutes | Sign-in locked for 15 minutes |

- A held transfer expires after **5 minutes** (no money moves). Expiry is checked on read, not by a timer.
- **Yes** needs the PIN and re-checks the balance. **No** freezes the account and ends every session.
- Alerts go to **trusted devices only**.
- 5 wrong PINs lock transfers for 15 minutes.
- Freeze my account: confirmation + PIN (confirmation only if the PIN is locked). Only an admin can unfreeze, with a written reason.

## Database tables

`users`, `wallets`, `transactions`, `sessions`, `known_devices`, `login_attempts`, `security_events` (append-only), `notifications`.

## Increments

| Phase | Tasks | Delivers |
|---|---|---|
| A · Setup (Inc 0) | A1–A4 | Rules, server, app on phone, shared components |
| B · Core wallet (Inc 1) | B1–B8 | FR-1 to FR-6 |
| C · Sessions and devices (Inc 2) | C1–C4 | FR-7 to FR-10 |
| D · Detection and alerts (Inc 3) | D1–D8 | FR-11 to FR-16 |
| E · Admin (Inc 4) | E1–E4 | FR-17 to FR-20 |
| F · Test and release | F1–F4 | Results, demo, APK, UAT |

## Progress

- [x] A1 Project rules and plan (approved 20 Nov 2026)
- [x] A2 Server skeleton and database (Docker Postgres + Adminer, GET /health, 1 passing test)
- [x] A3 App skeleton on the phone (Splash 01-Main shows "Server connected" on the Honor phone)
- [ ] A4 Shared components
