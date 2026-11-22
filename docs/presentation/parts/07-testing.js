/* Part 7: security and testing. Every number from docs/F1/ (test-results.md, measurements.md, screen-check.md). */

/** Tests per requirement, from docs/F1/test-results.md. The third value marks detection requirements. */
const TESTS_BY_FR = [["FR-1", 20], ["FR-2", 6], ["FR-3", 7], ["FR-4", 29], ["FR-5", 19], ["FR-6", 8], ["FR-7", 42], ["FR-8", 13], ["FR-9", 12],
  ["FR-11", 18, 1], ["FR-12", 15, 1], ["FR-13", 17, 1], ["FR-14", 21, 1], ["FR-15", 49, 1], ["FR-16", 11, 1], ["FR-17", 46], ["FR-18", 40], ["FR-19", 10], ["FR-20", 34]];

/** One bar per requirement, all on the same scale (longest = 49 tests). */
function testBars() {
  return TESTS_BY_FR.map(([fr, n, rule]) =>
    `<span class="fr">${fr}</span><span class="track"><span class="fill${rule ? " rule" : ""}" style="--v:${n}"></span></span><span class="v">${n}</span>`).join("");
}

addPart([
  /* Tests */
  `<section class="slide s-tests" aria-label="Automated tests">
    <div class="run"><span><b>06</b> &nbsp;Security and testing · automated tests</span><span class="num"></span></div>
    <div class="grid">
      <div style="display:flex;flex-direction:column;justify-content:center;gap:32px">
        <div class="big rise">279<small> / 279</small></div>
        <h2 class="rise" style="--i:1;font-size:58px;margin:0">Automated tests pass, for every requirement.</h2>
        <p class="lede rise" style="--i:2;font-size:24px">Jest + Supertest, against a separate test database. Every rule is tested firing, not firing, and exactly on its limit.</p>
      </div>
      <div style="display:flex;flex-direction:column;justify-content:center">
        <div class="bars rise" style="--i:2" aria-label="Tests per functional requirement">${testBars()}</div>
        <div class="legend"><span><i style="background:var(--blue)"></i>Wallet, sessions, admin</span><span><i style="background:var(--warn)"></i>Detection and alerts (FR-11 to FR-16)</span></div>
      </div>
    </div>
    <p class="source">Source: docs/F1/test-results.md, run 21 Nov 2026. A test can count for more than one requirement. FR-10 (server decides) has no row of its own.</p>
    <aside class="notes">
      <p>All 279 automated tests pass. They use Jest and Supertest, which send real HTTP requests to the server, against a separate test database so they never touch real data.</p>
      <p>Each bar is the number of tests for one requirement. Orange is detection and alerts. FR-15, holding a transfer and alerting the owner, has the most, 49, because it has the most paths: yes, no, expiry, wrong PIN, balance changed.</p>
      <p>Every rule is tested three ways: when it should fire, when it shouldn't, and exactly on the limit: exactly RM 500.00 does not fire, RM 500.01 does.</p>
    </aside>
  </section>`,

  /* Performance */
  `<section class="slide s-perf" aria-label="Performance">
    <div class="run"><span><b>06</b> &nbsp;Security and testing · performance</span><span class="num"></span></div>
    <h2 class="rise">The checks add no delay a user could notice.</h2>
    <p class="lede rise" style="--i:1;margin-top:24px">95th percentile: 10,000 runs per rule, 50 real requests per action, on the laptop server.</p>
    <div class="meters">
      <div class="meter rise" style="--i:2"><div class="label">Rule checks R1–R4</div><div class="val">&lt;0.01<small>ms</small></div>
        <div class="rows"><span>R1 large amount<b>0.0028</b></span><span>R2 velocity<b>0.0022</b></span><span>R4 failed logins<b>0.0022</b></span></div>
        <div class="gauge"><i style="width:0.1%"></i></div><div class="tgt"><span>Our target &lt; 50 ms</span><span class="pass">Pass</span></div></div>
      <div class="meter rise" style="--i:3"><div class="label">Server decision</div><div class="val">189<small>ms</small></div>
        <div class="rows"><span>Transfer sent<b>189 ms</b></span><span>Transfer held by R1<b>187 ms</b></span><span>Login<b>186 ms</b></span></div>
        <div class="gauge"><i style="width:18.9%"></i></div><div class="tgt"><span>Our target &lt; 1,000 ms</span><span class="pass">Pass</span></div></div>
      <div class="meter rise" style="--i:4"><div class="label">Hold → alert sent</div><div class="val">191<small>ms</small></div>
        <div class="rows"><span>Handed to Firebase<b>191 ms</b></span><span>Saved → push sent<b>2 ms</b></span><span>Shown on a real phone<b>pending</b></span></div>
        <div class="gauge"><i style="width:3.8%"></i></div><div class="tgt"><span>Our target &lt; 5,000 ms</span><span class="pass">Pass</span></div></div>
    </div>
    <p class="source">Source: docs/F1/measurements.md. The IR's performance requirement asks for "real time" without a number, so these targets are the project's own.</p>
    <aside class="notes">
      <p>I measured speed at the 95th percentile, meaning 95 percent of runs were at least this fast.</p>
      <p>A rule check takes a few thousandths of a millisecond, because the rules are pure functions. The whole server decision, including the PIN check with bcrypt and the database transaction, takes under 200 milliseconds. Holding a transfer and handing the alert to Firebase takes 191 milliseconds.</p>
      <p>My report asks for real-time detection without a number, so I set my own targets: 50 milliseconds for a rule, one second for a decision, five seconds for an alert. Everything passes with a large margin. Measuring the alert arriving on a real phone is still to do with the installed app.</p>
    </aside>
  </section>`,

  /* Screen check (optional) */
  `<section class="slide s-check" aria-label="Screen check (optional)">
    <div class="run"><span><b>06</b> &nbsp;Security and testing · screen check (optional)</span><span class="num"></span></div>
    <h2 class="rise">All 48 designed screens were checked against the built app.</h2>
    <div class="check-row">
      <div class="rise" style="--i:1">
        <div class="stackbar" aria-label="34 matched, 7 adapted, 7 fixed"><div class="a">34</div><div class="b">7</div><div class="c">7</div></div>
        <div class="stack-legend">
          <span><i style="background:var(--ok)"></i>34 matched the design first time</span>
          <span><i style="background:var(--blue)"></i>7 admin screens adapted for the web console, as agreed</span>
          <span><i style="background:var(--warn)"></i>7 had small differences, all fixed on 21 Nov 2026</span>
        </div>
      </div>
      <div class="facts rise" style="--i:2">
        <div class="fact"><b>Every phone screen now matches its design</b><span>Checked on the Honor phone with a large font size, so layouts were tested in a hard case.</span></div>
      </div>
    </div>
    <p class="source">Source: docs/F1/screen-check.md.</p>
    <aside class="notes">
      <p>Besides automated tests, I checked every one of the 48 designed screens against the real app on my phone.</p>
      <p>34 matched first time. The 7 admin screens were adapted for the web console, which we agreed. 7 had small differences, for example the password field hiding behind the keyboard on the login screen, and all 7 were fixed. Now every phone screen matches its design.</p>
    </aside>
  </section>`,

  /* UAT placeholder */
  `<section class="slide s-uat" aria-label="User acceptance testing">
    <div class="run"><span><b>06</b> &nbsp;Security and testing · user testing</span><span class="num"></span></div>
    <h2 class="rise">Real users tried MADD on their own.</h2>
    <span class="placeholder-tag rise" style="--i:1">Placeholder: results to be added after user testing</span>
    <div class="uat-grid">
      <div class="uat-cell rise" style="--i:2"><span class="label">Testers</span><span class="val">—</span><p>Number of people</p></div>
      <div class="uat-cell rise" style="--i:3"><span class="label">Tasks completed</span><span class="val">—</span><p>Send, receive, answer a held transfer</p></div>
      <div class="uat-cell rise" style="--i:4"><span class="label">Understood why</span><span class="val">—</span><p>Could explain why a transfer was held</p></div>
      <div class="uat-cell rise" style="--i:5"><span class="label">Satisfaction</span><span class="val">—</span><p>Average score out of 5</p></div>
    </div>
    <aside class="notes">
      <p>Placeholder. After user testing, this slide shows: how many testers, how many completed the tasks, how many could explain why their transfer was held, and the average satisfaction score, plus one or two short quotes.</p>
    </aside>
  </section>`,
]);
