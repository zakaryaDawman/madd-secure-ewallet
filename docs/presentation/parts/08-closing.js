/* Part 8: live demo, objectives achieved, limitations, future work, thank you. */
addPart([
  /* Live demo */
  `<section class="slide s-demo" aria-label="Live demo">
    <div class="run"><span><b>07</b> &nbsp;Demo</span><span class="num"></span></div>
    <h2 class="rise">Live demo <em>on the phone.</em></h2>
    <ol class="demo-steps">
      <li class="rise" style="--i:1"><span>1</span>Normal transfer</li>
      <li class="rise" style="--i:2"><span>2</span>R1 holds a large one</li>
      <li class="rise" style="--i:3"><span>3</span>Yes with PIN, or No and freeze</li>
      <li class="rise" style="--i:4"><span>4</span>The admin sees why</li>
    </ol>
    <aside class="notes">
      <p><b>Before the viva:</b> server running, phone plugged in (adb reverse tcp:3000 tcp:3000), demo account logged in, admin console open in the browser and logged in. Screen mirroring ready.</p>
      <p><b>0:00 · Log in and Home (30 s).</b> "This is MADD on my phone. Here's the balance, and Protection on: the four rules are watching."</p>
      <p><b>0:30 · Normal transfer (60 s).</b> Send RM 20 to the second demo account. Review, PIN, Checking, Sent. "No rule fired, so the money moved straight away."</p>
      <p><b>1:30 · R1 holds a large transfer (90 s).</b> Send RM 800. "It's above RM 500 and more than three times my usual transfer, so R1 holds it. No money has left my wallet. Here's why, in plain words, and a five-minute countdown." Tap Yes, enter PIN. "The server checks the balance again and sends it once."</p>
      <p><b>3:00 · No and freeze (45 s).</b> Trigger another hold, tap No. "The account is frozen and every session is ended, on every phone."</p>
      <p><b>3:45 · Admin console (75 s).</b> Switch to the browser. Open Flagged, then the event. "The admin sees the exact calculation and the timeline, but can't approve or cancel it." Unfreeze the account with a written reason. "That action is logged with my admin id."</p>
      <p><b>If something fails:</b> say "I'll show it from the slides", and use slides 22–23 for the hold, and 29–30 for the admin.</p>
    </aside>
  </section>`,

  /* Objectives achieved */
  `<section class="slide s-done" aria-label="Objectives achieved">
    <div class="run"><span><b>07</b> &nbsp;Conclusion · objectives</span><span class="num"></span></div>
    <h2 class="rise">Three objectives met in full. The fourth waits for user testing.</h2>
    <ol class="done-list">
      <li class="rise" style="--i:1"><span class="n">1</span><b>Investigate</b><p>Login-time security, similar systems and a survey of 31 users showed the gap after login.</p><div class="status"><span class="chip-ok">Achieved</span><span class="slides-ref">slides 4–6, 9–11</span></div></li>
      <li class="rise" style="--i:2"><span class="n">2</span><b>Design</b><p>Server-decides architecture, four rules with exact thresholds, ten tables.</p><div class="status"><span class="chip-ok">Achieved</span><span class="slides-ref">slides 12–15</span></div></li>
      <li class="rise" style="--i:3"><span class="n">3</span><b>Develop</b><p>A working Android app, server and admin console, with real-time holds and alerts.</p><div class="status"><span class="chip-ok">Achieved</span><span class="slides-ref">slides 16–30 · demo</span></div></li>
      <li class="rise" style="--i:4"><span class="n">4</span><b>Evaluate</b><p>279/279 tests, performance and screen check done. User testing still to come.</p><div class="status"><span class="chip-part">Partly achieved</span><span class="slides-ref">slides 31–45</span></div></li>
    </ol>
    <aside class="notes">
      <p>Back to my four objectives. One, investigate: done. I reviewed login-time security, compared Touch 'n Go, GrabPay and MAE, and surveyed 31 users, which confirmed the gap after login.</p>
      <p>Two, design: done. The architecture where the server decides everything, the four rules with exact thresholds, and the database.</p>
      <p>Three, develop: done. You've seen the app, the rules and the admin console working, live.</p>
      <p>Four, evaluate: partly. All 279 automated tests pass, performance is well within target, and every screen matches its design. User testing is the last step, and its results will complete this objective.</p>
    </aside>
  </section>`,

  /* Limitations */
  `<section class="slide s-limits" aria-label="Limitations">
    <div class="run"><span><b>07</b> &nbsp;Conclusion · limitations</span><span class="num"></span></div>
    <h2 class="rise">What MADD doesn't do yet.</h2>
    <ul class="limit-list">
      <li class="rise" style="--i:1"><b>Not online yet, so no HTTPS</b><span>It runs on my laptop, reached over USB. Hosting online adds HTTPS, which my own requirements ask for.</span></li>
      <li class="rise" style="--i:2"><b>Alert arrival not yet measured</b><span>The server hands the alert to Firebase in 191 ms. The time until it shows on the phone is still to measure.</span></li>
      <li class="rise" style="--i:3"><b>Same thresholds for everyone</b><span>RM 500, 3 transfers in 5 minutes, 5 wrong logins: fixed numbers, not tuned per user.</span></li>
      <li class="rise" style="--i:4"><b>Rules, not machine learning</b><span>Easy to explain and test, but they can't learn a fraud pattern no rule describes.</span></li>
      <li class="rise" style="--i:5"><b>No biometric login</b><span>Out of scope, as set in my report.</span></li>
      <li class="rise" style="--i:6"><b>Demo money only</b><span>No real bank or card is connected. Every account starts with RM 1,000 of demo money.</span></li>
    </ul>
    <aside class="notes">
      <p>MADD has limitations, and I'd rather state them myself.</p>
      <p>It isn't hosted online yet, so there's no HTTPS, which my own requirements ask for; that comes with hosting. I haven't measured how long the alert takes to appear on the phone, only the server side. The thresholds are the same for everyone. The rules can't learn new patterns the way machine learning could. Biometrics were out of scope. And it uses demo money, not a real bank.</p>
    </aside>
  </section>`,

  /* Future work */
  `<section class="slide s-future" aria-label="Future work">
    <div class="run"><span><b>07</b> &nbsp;Conclusion · future work</span><span class="num"></span></div>
    <h2 class="rise">Next, MADD would learn each user's habits.</h2>
    <div class="future-cards">
      <div class="future-card rise" style="--i:1"><span class="when">Next</span><b>Online with HTTPS</b><p>Host the server, then run user testing on testers' own phones.</p></div>
      <div class="future-card rise" style="--i:2"><span class="when">Next</span><b>Unfamiliar recipient rule</b><p>Supported by 58.1% of my survey respondents (Q14).</p></div>
      <div class="future-card rise" style="--i:3"><span class="when">Later</span><b>Thresholds per user</b><p>Limits that follow each person's own spending.</p></div>
      <div class="future-card rise" style="--i:4"><span class="when">Later</span><b>Machine learning beside the rules</b><p>Find new patterns, while the rules stay explainable.</p></div>
      <div class="future-card rise" style="--i:5"><span class="when">Later</span><b>Biometric login</b><p>Fingerprint or face, on top of the PIN.</p></div>
    </div>
    <p class="source">Survey figure: Investigation Report §3.4, Q14.</p>
    <aside class="notes">
      <p>First, I'd host MADD online with HTTPS and run user testing on people's own phones.</p>
      <p>Then a fifth rule: an unfamiliar recipient. 58.1 percent of my survey respondents supported it.</p>
      <p>Later, thresholds that adapt to each user, machine learning alongside the rules, with the rules kept because they're explainable, and biometric login.</p>
    </aside>
  </section>`,

  /* Thank you */
  `<section class="slide s-title s-thanks" aria-label="Thank you">
    <div class="left">
      <div class="wordmark rise"><span class="latin">MADD</span><span class="ar" lang="ar">مدّ</span></div>
      <h1 class="rise" style="--i:1">Thank you.</h1>
      <p class="q rise" style="--i:2">Questions?</p>
      <div class="meta rise" style="--i:3">
        <div><span>Student</span>Zakarya Dawman · TP079346</div>
        <div><span>Supervisor</span>Ts. Umapathy Eaganathan</div>
        <div><span>Second marker</span>Dr. Mohamed Shabbir Hamza Abdulnabi</div>
      </div>
    </div>
    <div class="right">
      <canvas class="wave" width="720" height="1080" aria-hidden="true"></canvas>
      <div class="phone rise" style="--i:2"><img src="screens/11-Held.png" alt="MADD held transfer screen"></div>
    </div>
    <aside class="notes">
      <p>To close: MADD keeps checking after login, holds anything unusual, explains why, and lets the owner decide. Thank you for listening. I'm happy to take your questions.</p>
    </aside>
  </section>`,
]);
