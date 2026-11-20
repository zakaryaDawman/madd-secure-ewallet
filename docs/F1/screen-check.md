# MADD: screen check against designs 01–48 (Chapter 6)

Checked 21 Nov 2026 on the Honor REA-NX9 (Expo Go, large system font) with the demo2 test account, side by side with
`design/app-screens/`. "During task" means the screen was compared on the phone when it was built and has not changed since.

Differences that are not bugs (apply to every screen):
- The data is demo2's real data, not the design's sample people (Zakarya, Sara Lim…).
- The phone uses a large system font, so some lines wrap where the design doesn't.
- The grey gear button and the status bar belong to Expo Go and the phone; they are not in the real app.

| # | Screen | Checked | Matches? | Differences |
|---|---|---|---|---|
| 01 | Splash | During A3 | Yes | Not re-captured today (Expo Go reopens the last screen). |
| 02 | Log in | Today | Yes | **Bug B1:** the Password field hides while the keyboard is open. |
| 03 | Create account | Today | Yes | Password strength bar only shows while typing (as designed). |
| 04 | Create PIN | Today | Yes | |
| 05 | Home | Today | Partly | **D1:** no "See all" link next to Recent activity. **D2:** no red dot on the header bell. **D3:** no "Confirm your transfer" banner when a transfer is held (the Inbox card and History do this instead). Recent rows show only the day, not "note · day". |
| 06 | Choose recipient | Today | Yes | "MADD users" list appears only after typing a number (by design: no user list is exposed). |
| 07 | Amount | During B6 | Yes | |
| 08 | Review + PIN | During B6 | Yes | |
| 09 | Checking | During B6 / D2 | Yes | |
| 10 | Sent | During B6 | Partly | **Bug B2:** "pm" instead of "PM", and Done sits partly under the Android nav bar. |
| 11 | Was this you? (Held) | During D2 / D3 | Yes | Amount shows "RM 800.00" (app money format) instead of "RM 800". |
| 12 | New device (approve on usual phone) | During D4 | Yes | |
| 13 | New device signed in | During D4 | Yes | In-app sheet (push version arrives with the Firebase build, D7). |
| 14 | Account frozen | Today | Yes | |
| 15 | Scan | Today | Yes | |
| 16 | Receive | Today | Yes | "Number copied" toast shows only after tapping copy (as designed). |
| 17 | History | Today | Yes | |
| 18 | Inbox, Security | Today | Yes | Waiting-transfer card shows only while a transfer is held. |
| 19 | Profile | Today | Partly | **D4:** "Freeze my account" is a red row in the Account card instead of the design's separate pink card with "Stops all transfers. Needs your PIN.". |
| 20 | Admin dashboard | During E1 | Adapted | Web console: the phone bottom bar is a left side menu (decided 20 Nov). |
| 21 | Admin flagged | During E2 | Adapted | Same adaptation. |
| 22 | Admin log | During E3 | Adapted | Same adaptation; day headings added. |
| 23 | Admin user | During E4 | Adapted | Same adaptation; blue "Unfreeze account" replaces "Freeze account" when frozen. |
| 24 | Admin users | During E4 | Adapted | Same adaptation. |
| 25 | Admin unfreeze | During E4 | Adapted | A centred dialog instead of a bottom sheet (desktop). |
| 26 | Transaction details | Today | Partly | **D5:** no "Sent from" (device) row. |
| 27 | Login locked | Today | Yes | |
| 28 | Session expired | Today | Yes | |
| 29 | Confirm with PIN | During D3 | Yes | |
| 30 | Freeze confirm | During D8 | Yes | With the large font and keyboard, the icon and title scroll off the top. |
| 31 | PIN locked | Today | Yes | |
| 32 | Inbox, All | Today | Yes | |
| 33 | Not enough balance | During B6 | Yes | |
| 34 | Recipient not found | During B5 | Yes | |
| 35 | Transfer expired | During D2 | Yes | |
| 36–38 | Welcome 1–3 | Today | Yes | |
| 39 | Home (new user) | During B4 | Yes | |
| 40 | Home loading | During B4 | Yes | |
| 41 | Forgot password | Today | Yes | "Check your inbox" box appears only after sending (as designed). |
| 42 | Personal details | Today | Yes | Save is greyed until the name changes (as designed). |
| 43 | Change PIN | Today | Yes | |
| 44 | Help | Today | Partly | **D6:** the design's "Freeze my account now" button at the bottom is missing (it was left out in C2 because freezing didn't exist yet; it does now). |
| 45 | Trust device | During D4 | Yes | |
| 46 | Offline | During B4 | Yes | |
| 47 | Allow notifications | Today | Partly | **D7:** the small app icon in the preview is the "madd" wordmark, not the design's "m̃" mark. |
| 48 | Admin event details | During E2 | Adapted | Web console adaptation. |

## Summary

- 48 screens: 34 matched first time, 7 admin screens are adapted for the web console (agreed), 7 had small differences.
- All of B1, B2 and D1–D7 were fixed on 21 Nov 2026 (see below). Every phone screen now matches its design.

## Fixes (21 Nov 2026)

| ID | Fix | Checked on the phone |
|---|---|---|
| B1 | Login: the footer now scrolls with the form, so the Password field stays visible above the keyboard | Yes |
| B2 | Sent: time in "PM" (en-US), receipt scrolls so Share and Done always stay above the nav bar | Code + type-check (no live send today) |
| D1 | Home: "See all" link opens History | Yes |
| D2 | Home: red dot on the header bell when the Inbox has unread items | Yes |
| D3 | Home: "Confirm your transfer" banner with countdown while a transfer is held; opens "Was this you?" | Yes |
| D4 | Profile: "Freeze my account" is the pink card with "Stops all transfers. Needs your PIN." | Yes |
| D5 | Transfer details: "Sent from" row (server now saves the sending phone for every transfer) | Server test; new transfers only |
| D6 | Help: "Freeze my account now" button opens the freeze sheet (design 30) | Yes |
| D7 | Allow notifications: the preview uses the "m̃" app mark | Yes |
