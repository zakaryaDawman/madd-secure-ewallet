/* Part 2: aim, objectives, similar systems and survey. Every number from the IR (§1.2, §1.3, §2.2.7, §3.4). */
addPart([
  /* Aim */
  `<section class="slide s-aim" aria-label="Project aim">
    <div class="run"><span><b>02</b> &nbsp;Aim and research</span><span class="num"></span></div>
    <div class="label rise">Project aim</div>
    <blockquote class="rise" style="--i:1">To develop a secure mobile e-wallet application capable of <em>detecting suspicious transactions in real time</em> to protect users from financial fraud.</blockquote>
    <p class="source" style="color:var(--sky)">Source: Investigation Report §1.2.</p>
    <aside class="notes">
      <p>This is my aim, exactly as in my report: to develop a secure mobile e-wallet application capable of detecting suspicious transactions in real time to protect users from financial fraud.</p>
      <p>The key words are "in real time": the check happens during the transfer, not afterwards.</p>
    </aside>
  </section>`,

  /* Objectives */
  `<section class="slide s-obj" aria-label="Four objectives">
    <div class="run"><span><b>02</b> &nbsp;Aim and research · objectives</span><span class="num"></span></div>
    <h2 class="rise">Four objectives took the project from research to a tested app.</h2>
    <ol class="objectives">
      <li class="rise" style="--i:1"><span class="n">1</span><b>Investigate</b><span>Existing authentication methods, transaction security practices and rule-based detection in current e-wallets.</span></li>
      <li class="rise" style="--i:2"><span class="n">2</span><b>Design</b><span>A secure e-wallet architecture with real-time, rule-based detection of suspicious transactions.</span></li>
      <li class="rise" style="--i:3"><span class="n">3</span><b>Develop</b><span>The app: core wallet functions, secure authentication, and real-time detection and alerts.</span></li>
      <li class="rise" style="--i:4"><span class="n">4</span><b>Evaluate</b><span>Usability and detection effectiveness, through testing and user feedback.</span></li>
    </ol>
    <p class="back rise" style="--i:5"><b>At the end</b>, each objective comes back with the evidence that it was met.</p>
    <p class="source">Source: Investigation Report §1.3.</p>
    <aside class="notes">
      <p>I set four objectives.</p>
      <p>One: investigate how current e-wallets authenticate users, secure transactions and detect fraud. Two: design an architecture with real-time, rule-based detection. Three: develop the app with core wallet functions, secure authentication and the detection and alert system. Four: evaluate it through testing and user feedback.</p>
      <p>At the end of the presentation I'll come back to each one and show the evidence that it was achieved.</p>
    </aside>
  </section>`,

  /* Similar systems */
  `<section class="slide s-compare" aria-label="Similar systems compared">
    <div class="run"><span><b>02</b> &nbsp;Aim and research · similar systems</span><span class="num"></span></div>
    <h2 class="rise">Malaysia's top e-wallets protect the login. None fully disclose how they check each transfer.</h2>
    <table class="cmp-table rise" style="--i:1">
      <thead><tr><th>Feature</th><th>Touch 'n Go</th><th>GrabPay</th><th>MAE by Maybank</th><th class="madd">MADD</th></tr></thead>
      <tbody>
        <tr><th>PIN authentication</th><td>Yes</td><td>Yes</td><td>Yes</td><td class="madd">Yes</td></tr>
        <tr><th>Device binding</th><td>Yes</td><td>Yes (device fingerprinting)</td><td>Yes (Secure2u)</td><td class="madd">Yes, the new-device rule</td></tr>
        <tr><th>Detection paradigm</th><td>Undisclosed</td><td>Machine learning + heuristics</td><td>Deterministic, at authorisation only</td><td class="madd">Rule-based, 4 defined conditions</td></tr>
        <tr><th>Transparency of detection</th><td class="weak">Low</td><td>Moderate</td><td class="weak">Low–Moderate</td><td class="madd">High: every rule specified and tested</td></tr>
        <tr><th>Amount monitoring</th><td class="weak">Not disclosed</td><td class="weak">Not disclosed in detail</td><td class="weak">Not disclosed</td><td class="madd">Explicit: R1 large amount</td></tr>
        <tr><th>Velocity monitoring</th><td class="weak">Not disclosed</td><td class="weak">Not disclosed in detail</td><td class="weak">Not disclosed</td><td class="madd">Explicit: R2 velocity</td></tr>
        <tr><th>Real-time alert</th><td class="weak">Not clearly disclosed</td><td>Implied via GrabDefence</td><td class="weak">Not clearly disclosed</td><td class="madd">Explicit: push alert on every hold</td></tr>
      </tbody>
    </table>
    <p class="source">Source: Investigation Report §2.2.7, Consolidated Comparison Matrix (7 of 12 rows shown).</p>
    <aside class="notes">
      <p>I studied three well-known Malaysian e-wallets: Touch 'n Go, GrabPay and MAE by Maybank.</p>
      <p>All three protect the login well: PIN, device binding, and MAE's Secure2u. But none of them publicly explains how each transfer is checked. Their detection is undisclosed, or in GrabPay's case machine learning that isn't open to inspection.</p>
      <p>MADD takes the opposite approach: four clearly defined rules, each one fully specified and tested, and an alert to the owner every time a transfer is held.</p>
      <p>The full comparison matrix has 12 rows; it's in my report, section 2.2.7.</p>
    </aside>
  </section>`,

  /* Survey: the problem is real */
  `<section class="slide s-survey" aria-label="Survey findings: the problem">
    <div class="run"><span><b>02</b> &nbsp;Aim and research · survey</span><span class="num"></span></div>
    <h2 class="rise">Users have been hit, and their apps rarely told them.</h2>
    <div class="respondents rise" style="--i:1"><b>31</b> e-wallet users answered my survey</div>
    <div class="findings">
      <div class="finding bad rise" style="--i:2"><div class="pct">45<small>%</small></div><p>have had confirmed or suspected unauthorised transactions</p><span class="q">Q6</span></div>
      <div class="finding bad rise" style="--i:3"><div class="pct">9.7<small>%</small></div><p>of those affected were alerted by their app; most found out themselves</p><span class="q">Q7</span></div>
      <div class="finding bad rise" style="--i:4"><div class="pct">0<small>%</small></div><p>were fully confident their app would stop misuse after a login is bypassed</p><span class="q">Q12</span></div>
      <div class="finding good rise" style="--i:5"><div class="pct">74.2<small>%</small></div><p>rated continuous monitoring after login "Extremely important"</p><span class="q">Q13</span></div>
    </div>
    <p class="source">Source: Investigation Report §3.4, survey of 31 e-wallet users.</p>
    <aside class="notes">
      <p>To check that this problem is real for actual users, I surveyed 31 e-wallet users.</p>
      <p>45 percent had confirmed or suspected unauthorised transactions. Of those affected, only 9.7 percent were alerted by their app; most found out on their own, sometimes too late.</p>
      <p>Nobody was fully confident their app would stop misuse after someone gets past the login. And 74.2 percent said continuous monitoring after login is extremely important.</p>
    </aside>
  </section>`,

  /* Survey: it shaped the design */
  `<section class="slide s-chart" aria-label="Survey findings: the design">
    <div class="run"><span><b>02</b> &nbsp;Aim and research · survey</span><span class="num"></span></div>
    <h2 class="rise">Users want to be asked, not blocked. So MADD holds and asks.</h2>
    <div class="grid">
      <div class="rise" style="--i:1">
        <div class="chart-title">When something looks suspicious, the app should… (Q16, % of 31)</div>
        <div class="hbars">
          <div class="hbar top" style="--i:1"><span class="lab">Ask me to confirm</span><span class="track"><span class="fill" style="--w:83.9%">83.9%</span></span></div>
          <div class="hbar" style="--i:2"><span class="lab">Notify me</span><span class="track"><span class="fill" style="--w:74.2%">74.2%</span></span></div>
          <div class="hbar" style="--i:3"><span class="lab">Block it automatically</span><span class="track"><span class="fill" style="--w:51.6%">51.6%</span></span></div>
          <div class="hbar" style="--i:4"><span class="lab">Lock my account</span><span class="track"><span class="fill" style="--w:45.2%">45.2%</span></span></div>
        </div>
        <div class="axis"><span></span><span><span>0%</span><span>50%</span><span>100%</span></span></div>
      </div>
      <div class="side-facts">
        <div class="fact rise" style="--i:3"><b>Over 80%</b><span>accept a short delay while a suspicious transfer is checked (Q17).</span></div>
        <div class="fact rise" style="--i:4"><b>No one</b><span>found extra verification "too inconvenient" (Q19).</span></div>
      </div>
    </div>
    <p class="source">Source: Investigation Report §3.4. Respondents could choose more than one answer in Q16.</p>
    <aside class="notes">
      <p>The survey also shaped the design. When something looks suspicious, 83.9 percent want to be asked to confirm, and 74.2 percent want to be notified. Blocking automatically and locking the account were much less popular.</p>
      <p>That's exactly why MADD holds the transfer and asks the owner, instead of silently blocking it.</p>
      <p>Over 80 percent accept a short delay for the check, and nobody said extra verification was too inconvenient.</p>
      <p>If asked about alerts: in Q18, in-app pop-ups were preferred (83.9 percent) over push when the app is closed (35.5 percent). MADD does both: the alert shows inside the app, in the Inbox, and as a push to trusted phones.</p>
    </aside>
  </section>`,
]);
