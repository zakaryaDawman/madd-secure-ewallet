# MADD: performance measurements (Chapter 6)

Measured on 21/11/2026, 00:10:39 (Malaysia time) on AMD Ryzen 5 5600G with Radeon Graphics, 17 GB RAM, Node v22.22.0, PostgreSQL 16 in Docker, all on one laptop.

**Targets are suggested values (rule < 50 ms, decision < 1 s, alert < 5 s); replace them with the SRS NFR values if different.** Pass/Fail is judged on the 95th percentile.

## 1. Rule evaluation (pure functions, no database)

| Measured | Runs | Mean | Median | 95th % | Max | Target | Result |
|---|---|---|---|---|---|---|---|
| R1 Large amount (200 past transfers) | 10000 | 0.0025 ms | 0.0008 ms | 0.0028 ms | 10 ms | < 50 ms | Pass |
| R2 Velocity | 10000 | 0.0010 ms | 0.0004 ms | 0.0022 ms | 1 ms | < 50 ms | Pass |
| R3 Unknown device | 10000 | 0.0001 ms | 0.0001 ms | 0.0001 ms | 0.1481 ms | < 50 ms | Pass |
| R4 Failed logins (10 attempts) | 10000 | 0.0009 ms | 0.0005 ms | 0.0022 ms | 0.4331 ms | < 50 ms | Pass |
| Sign-in lock (R4 over time) | 10000 | 0.0020 ms | 0.0013 ms | 0.0034 ms | 0.4943 ms | < 50 ms | Pass |
| PIN lock | 10000 | 0.0004 ms | 0.0001 ms | 0.0008 ms | 0.2661 ms | < 50 ms | Pass |

## 2. Server decisions over HTTP (PIN or password check, rules, database)

| Measured | Runs | Mean | Median | 95th % | Max | Target | Result |
|---|---|---|---|---|---|---|---|
| Normal transfer (sent) | 50 | 186 ms | 186 ms | 189 ms | 193 ms | < 1000 ms | Pass |
| Unusual transfer (held by R1) | 50 | 185 ms | 185 ms | 187 ms | 190 ms | < 1000 ms | Pass |
| Login | 50 | 183 ms | 183 ms | 186 ms | 187 ms | < 1000 ms | Pass |

Most of this time is the bcrypt check (cost 12): one check takes about 170 ms here. That slowness is deliberate, so stolen hashes are hard to guess.

## 3. Alert time (event → push sent)

| Measured | Runs | Mean | Median | 95th % | Max | Target | Result |
|---|---|---|---|---|---|---|---|
| Held transfer → push handed to Firebase | 50 | 187 ms | 188 ms | 191 ms | 196 ms | < 5000 ms | Pass |
| push_log: event saved → push sent | 50 | 1 ms | 1 ms | 2 ms | 9 ms | < 5000 ms | Pass |

Measured with a stand-in for Firebase, so this is the time MADD takes to decide and hand the alert over. Delivery to a real phone
over the internet is added after the Firebase setup and app build (D7, still to do), and should be measured then:

| Held transfer → alert shown on a real phone | (after the build) | | | | | < 5000 ms | To measure |
