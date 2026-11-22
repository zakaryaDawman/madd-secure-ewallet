/* Part 6b: the six protections, then attacking MADD (attack data in 06b-attack-data.js). Every request and reply below was captured by running server/scripts/attack-demo.sh
   against the local server (test accounts only), 22 Nov 2026. Code is copied from the files named, with real line numbers. */

/** The server layers a request passes through, in order. */
const LAYERS = [
  ["Security headers", "helmet"], ["Size limit", "json 10 KB"], ["Who are you?", "requireAuth"], ["Allowed here?", "requireRole"],
  ["Valid input?", "zod schema"], ["Right PIN?", "checkPin"], ["Unusual?", "rules R1–R4"], ["Database", "locks · trigger"],
];

/** Escapes text so code and JSON show exactly as written. */
function esc(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The pipeline for one attack: layers before `stop` pass, `stop` blocks (or holds), later ones are never reached. */
function pipeline(stop, kind = "stop", skipBefore = false) {
  return `<div class="pipe">${LAYERS.map(([name, code], i) => {
    const state = i < stop ? (skipBefore ? "l-skip" : "l-pass") : i === stop ? `l-${kind}` : "l-after";
    return `<div class="layer ${state}" style="--i:${i}"><b>${name}</b><span>${code}</span></div>`;
  }).join("")}</div>`;
}

/** A code box: one or more files, each with its first line number and the lines to highlight. */
function codeBox(files) {
  return `<div class="code">${files.map((f) => `<div class="file"><div class="bar"><span>${f.file}</span><span>line ${f.from}</span></div><pre>${
    f.lines.map((line, k) => `<span class="ln${f.hl.includes(f.from + k) ? " hl" : ""}"><i>${f.from + k}</i>${esc(line)}</span>`).join("")
  }</pre></div>`).join("")}</div>`;
}

/** Builds one five-step attack slide from its data. */
function attackSlide(a) {
  const steps = ["Attack", "Journey", "Code", "Response", "User sees"].map((s, i) => `<span><i>${i + 1}</i>${s}</span>`).join("");
  const ui = a.screen
    ? `<div class="phone small"><img src="screens/${a.screen}.png" alt="${a.screenAlt}">${a.y ? `<span class="pin bad" style="--y:${a.y};--i:1">!</span>` : ""}</div>`
    : "";
  return `<section class="slide atk" data-steps="5" data-step="1" aria-label="Attack ${a.n}: ${a.name}">
    <div class="run"><span><b>06</b> &nbsp;Attacking MADD · attack ${a.n} of 11</span><span class="num"></span></div>
    <div class="head"><h2>${a.title}</h2><div class="steps">${steps}</div></div>
    ${pipeline(a.stop, a.kind, a.skipBefore)}
    <div class="stage-area">
      <div class="panel p1"><div class="say"><span class="k">1 · The attack</span><p>${a.idea}</p></div>
        <div class="term"><div class="bar"><span>attacker's terminal</span><span>${a.tool || "curl"}</span></div><pre>${a.request}</pre></div></div>
      <div class="panel p2"><div class="say"><span class="k">2 · The journey</span><p>${a.journey}</p></div>
        <div class="say" style="flex:1"><p style="color:var(--muted);font-size:23px">${a.journeyMore || ""}</p></div></div>
      <div class="panel p3"><div class="say"><span class="k">3 · The code that stops it</span><p>${a.why}</p></div>${codeBox(a.code)}</div>
      <div class="panel p4"><div class="say"><span class="k">4 · The real response</span><p>${a.respSay}</p></div>
        <div class="resp"><div class="status ${a.statusTone || ""}"><b>${a.status}</b><span>${a.statusText}</span></div>
          <div class="term"><pre>${esc(a.body)}</pre></div></div></div>
      <div class="panel p5">${ui}<div class="say" style="flex:1"><span class="k">5 · What the user sees</span><p>${a.ui}</p></div></div>
    </div>
    <aside class="notes">${a.notes.map((p) => `<p>${p}</p>`).join("")}</aside>
  </section>`;
}

addPart([
  /* How the server protects money */
  `<section class="slide s-sec" aria-label="How the server protects money">
    <div class="run"><span><b>06</b> &nbsp;Security and testing</span><span class="num"></span></div>
    <h2 class="rise">Six protections, all on the server, so a modified app can't skip them.</h2>
    <div class="protections">
      <div class="protection rise" style="--i:1"><b>The server decides</b><p>Every trust decision is made on the server. The app only shows results.</p><code>FR-10 · requireAuth, requireRole</code></div>
      <div class="protection rise" style="--i:2"><b>Money in whole sen</b><p>RM 1.00 is stored as 100. No decimals, so no rounding errors.</p><code>wallets.balance_sen</code></div>
      <div class="protection rise" style="--i:3"><b>No double spending</b><p>One database transaction locks both wallets, always in the same order.</p><code>SELECT … FOR UPDATE</code></div>
      <div class="protection rise" style="--i:4"><b>Hashed secrets</b><p>Passwords and PINs are stored only as bcrypt hashes, never logged or returned.</p><code>bcrypt, cost 12</code></div>
      <div class="protection rise" style="--i:5"><b>Short sessions</b><p>30-minute JWT with session and device id. Revoked on logout or freeze. Kept in secure storage.</p><code>sessions · expo-secure-store</code></div>
      <div class="protection rise" style="--i:6"><b>A log nobody can edit</b><p>A database trigger refuses any update or delete, even from an admin.</p><code>security_events trigger</code></div>
    </div>
    <p class="pending rise" style="--i:7"><b>Pending:</b><span>HTTPS between app and server (IR non-functional requirement). Today the app talks to the laptop over USB; HTTPS comes with online hosting.</span></p>
    <aside class="notes">
      <p>Security in MADD rests on one principle: the server makes every decision. If someone modified the app, they still couldn't skip a check, because none of the checks are in the app.</p>
      <p>Money is stored as whole sen, so there are no rounding errors. A transfer runs in one database transaction that locks both wallets, always in the same order, so two transfers can't spend the same money or block each other.</p>
      <p>Passwords and PINs are bcrypt hashes. Sessions last 30 minutes, carry the session and device id, and can be revoked; the token is kept in the phone's secure storage. And the security log is append-only, enforced by the database itself.</p>
      <p>One requirement from my report is still pending: HTTPS. Today the phone talks to my laptop over USB. When the server is hosted online, it gets HTTPS automatically.</p>
    </aside>
  </section>`,

  `<section class="slide s-atk-map" aria-label="Attacking MADD overview">
    <div class="run"><span><b>06</b> &nbsp;Attacking MADD</span><span class="num"></span></div>
    <h2 class="rise">I attacked my own system 11 times. Here is where each attack stopped.</h2>
    <p class="lede rise" style="--i:1;margin-top:20px">Every attack was run for real against the server, using test accounts. Every reply on the next slides is the real one.</p>
    <div class="pipe rise" style="--i:2;margin-top:48px">${LAYERS.map(([name, code]) => `<div class="layer"><b>${name}</b><span>${code}</span></div>`).join("")}</div>
    <div class="atk-map rise" style="--i:3">
      <div class="col"></div><div class="col"></div>
      <div class="col"><span class="tag">1 Forged token</span><span class="tag">2 Token replay</span></div>
      <div class="col"><span class="tag">3 Admin routes</span></div>
      <div class="col"><span class="tag">4 Bad amounts</span></div>
      <div class="col"><span class="tag">8 PIN guessing</span><span class="tag">9 Password guessing</span></div>
      <div class="col"><span class="tag warn">10 New phone</span><span class="tag">6 User scanning</span><span class="tag">5 Other's transfer</span></div>
      <div class="col"><span class="tag">7 Double spend</span><span class="tag">11 Log tampering</span></div>
    </div>
    <p class="source">Script: server/scripts/attack-demo.sh. Attacks 5, 6 and 9 are stopped by checks inside the route (ownership, rate limit, login lock).</p>
    <aside class="notes">
      <p>As a cybersecurity student, I didn't want to only describe the defences, so I attacked my own system. Eleven attacks, run for real with a script, against test accounts.</p>
      <p>This row is every layer a request passes through on the server. Each attack is pinned to the layer that stopped it. For the next slides, I'll step through the main ones: the request, its path, the code that stops it, the real reply, and what the user sees.</p>
    </aside>
  </section>`,

  ...ATTACKS.map(attackSlide),

  /* The quick ones and the summary */
  `<section class="slide s-atk-sum" aria-label="All attacks summary">
    <div class="run"><span><b>06</b> &nbsp;Attacking MADD · results</span><span class="num"></span></div>
    <h2 class="rise">11 attacks, 11 stopped. No money moved and nothing was revealed.</h2>
    <table class="sum-table rise" style="--i:1">
      <thead><tr><th>#</th><th>Attack</th><th>Reply</th><th>Stopped by</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Forge a token (role → admin)</td><td>401</td><td>requireAuth · JWT signature</td></tr>
        <tr><td>2</td><td>Reuse a token after logout</td><td>401</td><td>requireAuth · session revoked</td></tr>
        <tr><td>3</td><td>Customer calls admin routes</td><td>403 / 404</td><td>requireRole · role from database</td></tr>
        <tr><td>4</td><td>Negative or decimal amount</td><td>400</td><td>zod validation</td></tr>
        <tr><td>5</td><td>Read someone else's transfer</td><td>404</td><td>ownership in the query · same reply as missing</td></tr>
        <tr><td>6</td><td>Scan phone numbers for users</td><td>429</td><td>rate limit · 10 a minute per user</td></tr>
        <tr><td>7</td><td>Spend the same money twice</td><td>201 + 400</td><td>SELECT … FOR UPDATE</td></tr>
        <tr><td>8</td><td>Guess the transfer PIN</td><td>403 → 423</td><td>PIN lock · 5 tries</td></tr>
        <tr><td>9</td><td>Guess the password</td><td>401 → 423</td><td>R4 · same reply for unknown emails</td></tr>
        <tr><td>10</td><td>Stolen password, new phone</td><td>202 held</td><td>R3 · untrusted device</td></tr>
        <tr><td>11</td><td>Edit the log in the database</td><td>ERROR</td><td>append-only trigger</td></tr>
      </tbody>
    </table>
    <aside class="notes">
      <p>All eleven results. Three I didn't step through: reading someone else's transfer gives the same 404 as a transfer that doesn't exist, so an attacker can't even tell it exists. Scanning phone numbers is limited to 10 searches a minute per user; the 11th got 429. And password guessing: the 5th wrong password locks sign-in for 15 minutes, and an email that doesn't exist gets exactly the same reply, so attackers can't find accounts.</p>
      <p>If you'd like, I can run the whole script live now; it takes about 30 seconds.</p>
    </aside>
  </section>`,
]);
