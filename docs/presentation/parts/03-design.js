/* Part 3: method and design. Thresholds from server/src/rules/config.ts, tables from server/src/db/schema.sql. */

/** One step of the increment staircase: x position, height, label lines and colours. */
function incrementStep(x, height, kind, title, frs, tasks, filled) {
  const y = 500 - height;
  const box = filled ? "var(--blue)" : kind === "phase" ? "var(--white)" : "var(--tint)";
  const ink = filled ? "var(--white)" : "var(--ink)";
  const sub = filled ? "var(--sky)" : "var(--muted)";
  return `<g>
    <rect x="${x}" y="${y}" width="258" height="${height}" rx="20" style="fill:${box};stroke:var(--line);stroke-width:${filled ? 0 : 2}"/>
    <text x="${x + 24}" y="${y + 42}" class="mono" style="fill:${sub};font-size:18px;font-weight:700">${frs}</text>
    <text x="${x + 24}" y="${y + 82}" style="fill:${ink};font-size:27px;font-weight:800">${title[0]}</text>
    <text x="${x + 24}" y="${y + 114}" style="fill:${ink};font-size:27px;font-weight:800">${title[1] ?? ""}</text>
    <text x="${x + 24}" y="${y + height - 24}" class="mono" style="fill:${sub};font-size:17px">${tasks}</text>
  </g>`;
}

addPart([
  /* Incremental model */
  `<section class="slide s-method" aria-label="Incremental development">
    <div class="run"><span><b>03</b> &nbsp;Method and design · methodology</span><span class="num"></span></div>
    <h2 class="rise">Built in four increments. Each one was tested before the next began.</h2>
    <svg class="diagram rise" style="--i:1" viewBox="0 0 1696 520" role="img" aria-label="Setup, then increments 1 to 4, then testing, each step higher than the last">
      ${incrementStep(0, 150, "phase", ["Setup", ""], "PHASE A", "A1–A4", false)}
      ${incrementStep(287, 220, "inc", ["Core", "wallet"], "INC 1 · FR-1–6", "B1–B8", false)}
      ${incrementStep(574, 280, "inc", ["Sessions and", "devices"], "INC 2 · FR-7–10", "C1–C4", false)}
      ${incrementStep(861, 340, "inc", ["Detection", "and alerts"], "INC 3 · FR-11–16", "D1–D8", true)}
      ${incrementStep(1148, 400, "inc", ["Admin", "console"], "INC 4 · FR-17–20", "E1–E4", false)}
      ${incrementStep(1435, 460, "phase", ["Test and", "release"], "PHASE F", "F1–F4", false)}
      <line x1="0" y1="510" x2="1696" y2="510" style="stroke:var(--line);stroke-width:2"/>
    </svg>
    <p class="source">Source: Investigation Report §3.1 (Incremental model); PLAN.md. Increment 3 is the project's main contribution.</p>
    <aside class="notes">
      <p>I used the Incremental model, as justified in my report. Each increment delivered a group of requirements and was fully tested before I started the next one.</p>
      <p>Setup first: the rules, the server, the database and the app on my phone. Increment 1 is the core wallet, FR-1 to 6. Increment 2 is sessions and devices, FR-7 to 10. Increment 3, in blue, is detection and alerts, FR-11 to 16: the main contribution of the project. Increment 4 is the admin console, FR-17 to 20. Then testing and release.</p>
      <p>Each step sits higher because it builds on the one before: detection needs sessions and devices, and sessions need the wallet.</p>
    </aside>
  </section>`,

  /* Architecture */
  `<section class="slide s-arch" aria-label="System architecture">
    <div class="run"><span><b>03</b> &nbsp;Method and design · architecture</span><span class="num"></span></div>
    <h2 class="rise">The phone only shows results. The server makes every decision.</h2>
    <svg class="diagram rise" style="--i:1" viewBox="0 0 1696 720" role="img" aria-label="Phone app and admin console talk to the Express server, which uses PostgreSQL and sends alerts through Firebase to trusted phones">
      <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/></marker></defs>

      <rect x="0" y="40" width="340" height="210" rx="22" style="fill:var(--white);stroke:var(--line);stroke-width:2"/>
      <text x="28" y="92" class="mono" style="fill:var(--muted);font-size:17px;font-weight:700">CUSTOMER</text>
      <text x="28" y="136" style="fill:var(--ink);font-size:32px;font-weight:800">Phone app</text>
      <text x="28" y="176" style="fill:var(--muted);font-size:21px">React Native · Expo · Android</text>
      <text x="28" y="210" style="fill:var(--muted);font-size:21px">Token in secure storage</text>

      <rect x="0" y="430" width="340" height="210" rx="22" style="fill:var(--white);stroke:var(--line);stroke-width:2"/>
      <text x="28" y="482" class="mono" style="fill:var(--muted);font-size:17px;font-weight:700">STAFF</text>
      <text x="28" y="526" style="fill:var(--ink);font-size:32px;font-weight:800">Admin console</text>
      <text x="28" y="566" style="fill:var(--muted);font-size:21px">React · Vite · web</text>
      <text x="28" y="600" style="fill:var(--muted);font-size:21px">Token in memory only</text>

      <rect x="560" y="40" width="580" height="600" rx="26" style="fill:var(--ink)"/>
      <text x="596" y="94" class="mono" style="fill:var(--sky);font-size:17px;font-weight:700">SERVER · NODE.JS + EXPRESS</text>
      <text x="596" y="140" style="fill:var(--white);font-size:34px;font-weight:800">Every trust decision</text>
      ${[
        ["requireAuth", "JWT signature, session not expired or revoked"],
        ["requireRole('admin')", "role read from the database on every /admin call"],
        ["Rules R1–R4", "pure functions, thresholds in config.ts"],
        ["Transfer", "one transaction, SELECT … FOR UPDATE"],
      ].map(([name, what], i) => `
        <rect x="596" y="${176 + i * 112}" width="508" height="92" rx="16" style="fill:rgba(255,255,255,.07)"/>
        <text x="624" y="${214 + i * 112}" class="mono" style="fill:var(--white);font-size:21px;font-weight:700">${name}</text>
        <text x="624" y="${246 + i * 112}" style="fill:var(--sky);font-size:19px">${what}</text>`).join("")}

      <rect x="1356" y="40" width="340" height="250" rx="22" style="fill:var(--white);stroke:var(--line);stroke-width:2"/>
      <text x="1384" y="92" class="mono" style="fill:var(--muted);font-size:17px;font-weight:700">DATABASE</text>
      <text x="1384" y="136" style="fill:var(--ink);font-size:32px;font-weight:800">PostgreSQL 16</text>
      <text x="1384" y="176" style="fill:var(--muted);font-size:21px">Money in whole sen</text>
      <text x="1384" y="210" style="fill:var(--muted);font-size:21px">bcrypt hashes only</text>
      <text x="1384" y="244" style="fill:var(--muted);font-size:21px">Append-only security log</text>

      <rect x="1356" y="430" width="340" height="210" rx="22" style="fill:var(--white);stroke:var(--line);stroke-width:2"/>
      <text x="1384" y="482" class="mono" style="fill:var(--muted);font-size:17px;font-weight:700">ALERTS</text>
      <text x="1384" y="526" style="fill:var(--ink);font-size:32px;font-weight:800">Firebase (FCM)</text>
      <text x="1384" y="566" style="fill:var(--muted);font-size:21px">Push to trusted phones</text>
      <text x="1384" y="600" style="fill:var(--muted);font-size:21px">Sent after the data is saved</text>

      <g style="stroke:var(--muted);stroke-width:3;fill:none">
        <line x1="344" y1="145" x2="552" y2="145" marker-end="url(#arr)" marker-start="url(#arr)"/>
        <line x1="344" y1="535" x2="552" y2="535" marker-end="url(#arr)" marker-start="url(#arr)"/>
        <line x1="1144" y1="165" x2="1348" y2="165" marker-end="url(#arr)" marker-start="url(#arr)"/>
        <line x1="1144" y1="535" x2="1348" y2="535" marker-end="url(#arr)"/>
        <path d="M1526,644 V700 H170 V258" marker-end="url(#arr)" style="stroke:var(--warn);stroke-dasharray:10 8"/>
      </g>
      <text x="448" y="128" text-anchor="middle" style="fill:var(--muted);font-size:18px">JSON + JWT</text>
      <text x="448" y="518" text-anchor="middle" style="fill:var(--muted);font-size:18px">/admin only</text>
      <text x="1246" y="148" text-anchor="middle" style="fill:var(--muted);font-size:18px">SQL</text>
      <text x="1246" y="518" text-anchor="middle" style="fill:var(--muted);font-size:18px">alert</text>
      <text x="848" y="690" text-anchor="middle" style="fill:var(--warn-ink);font-size:19px;font-weight:700">Push alert when a transfer is held, a new phone signs in, or sign-in is locked</text>
    </svg>
    <aside class="notes">
      <p>This is the architecture. On the left, the two clients: the customer's phone app, built with React Native, and the admin web console, built with React.</p>
      <p>In the middle is the Express server, and this is the key point: every trust decision happens here. Each request passes requireAuth, which checks the JWT and that the session is still valid. Admin routes also pass requireRole, which reads the role from the database every time. Transfers run the four rules, then move money inside one database transaction with row locks.</p>
      <p>On the right, PostgreSQL stores money as whole sen, only bcrypt hashes of passwords and PINs, and an append-only security log. When a rule fires, the server sends a push through Firebase, only to the user's trusted phones, and only after the data is saved.</p>
      <p>The phone app decides nothing; it only shows what the server says.</p>
    </aside>
  </section>`,

  /* The four rules */
  `<section class="slide s-rules" aria-label="The four detection rules">
    <div class="run"><span><b>03</b> &nbsp;Method and design · detection rules</span><span class="num"></span></div>
    <h2 class="rise">Four rules, each a pure function with its own tests.</h2>
    <div class="rule-cards">
      <div class="rule-card rise" style="--i:1"><div class="top"><span class="id">R1</span><span class="sev med">Medium</span></div><b>Large amount</b>
        <div class="when">amount &gt; max(RM 500,<br>3 × your average)</div>
        <div class="then"><strong>Transfer held</strong> until the owner confirms with PIN.</div><span class="fr">FR-11 · largeAmount.ts</span></div>
      <div class="rule-card rise" style="--i:2"><div class="top"><span class="id">R2</span><span class="sev med">Medium</span></div><b>Velocity</b>
        <div class="when">more than 3 transfers<br>within 5 minutes</div>
        <div class="then">The 4th transfer is <strong>held</strong> until the owner confirms.</div><span class="fr">FR-12 · velocity.ts</span></div>
      <div class="rule-card rise" style="--i:3"><div class="top"><span class="id">R3</span><span class="sev high">High</span></div><b>Unknown device</b>
        <div class="when">login from a phone<br>that is not trusted</div>
        <div class="then">Allowed in, but <strong>its transfers wait</strong> for the usual phone.</div><span class="fr">FR-13 · unknownDevice.ts</span></div>
      <div class="rule-card rise" style="--i:4"><div class="top"><span class="id">R4</span><span class="sev high">High</span></div><b>Failed logins</b>
        <div class="when">5 wrong passwords<br>within 15 minutes</div>
        <div class="then"><strong>Sign-in locked</strong> for 15 minutes.</div><span class="fr">FR-14 · failedLogins.ts</span></div>
    </div>
    <p class="limits rise" style="--i:5"><span>A held transfer expires after <b>5 minutes</b>, and no money moves.</span><span><b>5</b> wrong PINs in a row lock transfers for <b>15 minutes</b>.</span></p>
    <p class="source">Source: server/src/rules/config.ts and the rule files in server/src/rules/.</p>
    <aside class="notes">
      <p>These are the four rules, with the exact numbers from the code. All thresholds live in one file, config.ts.</p>
      <p>R1, large amount: a transfer is held if it's above RM 500 and above three times the user's own average. R2, velocity: more than three transfers in five minutes, so the fourth one is held. Both are medium severity.</p>
      <p>R3, unknown device: a new phone can log in, but its transfers wait for approval from the usual, trusted phone. R4, failed logins: five wrong passwords in fifteen minutes lock sign-in for fifteen minutes. These two are high severity, because a new phone or password guessing suggests someone else.</p>
      <p>A held transfer expires after five minutes without moving any money. And five wrong PINs in a row lock transfers for fifteen minutes.</p>
      <p>Each rule is a pure function: same input, same answer, no database. That's why each one is easy to test, including exactly on the limit.</p>
    </aside>
  </section>`,

  /* Database (optional) */
  `<section class="slide s-db" aria-label="Database tables">
    <div class="run"><span><b>03</b> &nbsp;Method and design · database (optional)</span><span class="num"></span></div>
    <h2 class="rise">Ten tables. The security log can only grow.</h2>
    <div class="db-groups">
      <div class="db-group rise" style="--i:1"><h3>Money</h3><dl>
        <div><dt>users</dt><dd>Account, role, bcrypt password and PIN hashes, frozen time</dd></div>
        <div><dt>wallets</dt><dd>Balance in whole sen (RM 1.00 = 100)</dd></div>
        <div><dt>transactions</dt><dd>Completed, pending (held), cancelled or expired</dd></div>
      </dl></div>
      <div class="db-group rise" style="--i:2"><h3>Access</h3><dl>
        <div><dt>sessions</dt><dd>One per login; expiry and revoke</dd></div>
        <div><dt>known_devices</dt><dd>Each phone, trusted or not (R3)</dd></div>
        <div><dt>login_attempts</dt><dd>Every sign-in, success or not (R4)</dd></div>
        <div><dt>pin_attempts</dt><dd>Wrong PINs, for the PIN lock</dd></div>
      </dl></div>
      <div class="db-group sec rise" style="--i:3"><h3>Security record</h3><dl>
        <div><dt>security_events</dt><dd>Every rule that fired. A database trigger refuses any edit or delete.</dd></div>
        <div><dt>notifications</dt><dd>The user's Inbox</dd></div>
        <div><dt>push_log</dt><dd>When each alert was sent, for timing</dd></div>
      </dl></div>
    </div>
    <p class="source">Source: server/src/db/schema.sql.</p>
    <aside class="notes">
      <p>The database has ten tables in three groups.</p>
      <p>Money: users, wallets and transactions. Balances are whole numbers of sen, never decimals, so there are no rounding errors. Passwords and PINs are stored only as bcrypt hashes.</p>
      <p>Access: sessions, known devices, login attempts and PIN attempts. These feed rules R3 and R4 and the PIN lock.</p>
      <p>Security record: security_events stores every rule that fired. It's append-only: a database trigger refuses any update or delete, so not even an admin can change the history.</p>
    </aside>
  </section>`,
]);
