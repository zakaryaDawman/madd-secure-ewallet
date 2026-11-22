/* Part 1: opening and the problem. Facts and numbers only from the IR, section 1.1. */
addPart([
  /* Title */
  `<section class="slide s-title" aria-label="Title">
    <div class="left">
      <div class="wordmark rise"><span class="latin">MADD</span><span class="ar" lang="ar">مدّ</span></div>
      <h1 class="rise" style="--i:1">A wallet that keeps <em>checking</em> after you log in.</h1>
      <p class="sub rise" style="--i:2">Development of a secure mobile e-wallet application with real-time suspicious transaction detection.</p>
      <div class="meta rise" style="--i:3">
        <div><span>Student</span>Zakarya Dawman · TP079346</div>
        <div><span>Supervisor</span>Ts. Umapathy Eaganathan</div>
        <div><span>Second marker</span>Dr. Mohamed Shabbir Hamza Abdulnabi</div>
      </div>
    </div>
    <div class="right">
      <canvas class="wave" width="720" height="1080" aria-hidden="true"></canvas>
      <div class="phone rise" style="--i:2"><img src="screens/05-Home.png" alt="MADD home screen"></div>
    </div>
    <aside class="notes">
      <p>Good morning. My name is Zakarya Dawman, TP079346, BSc Computer Science with a specialism in Cybersecurity. My supervisor is Ts. Umapathy, and my second marker is Dr. Shabbir.</p>
      <p>My project is MADD: a secure mobile e-wallet that keeps checking every transfer after you log in, and asks you before anything unusual goes through.</p>
    </aside>
  </section>`,

  /* My story */
  `<section class="slide s-story" aria-label="Why I built MADD">
    <div class="left">
      <div class="run"><span><b>Why this project</b></span><span class="num"></span></div>
      <h2 class="rise">I'm from Yemen, where keeping money safe is something you think about every day.</h2>
      <p class="quote rise" style="--i:1">In Malaysia, paying became one tap. But one tap is also all a thief needs. <b>Security has always mattered to me</b>, so I wanted to add one feature: a wallet that asks me before anything unusual goes through.</p>
      <div class="name-card rise" style="--i:2">
        <span class="ar" lang="ar">مدّ</span>
        <p><b>Madda</b> is the Arabic mark that extends a sound. MADD extends protection beyond the moment you log in.</p>
      </div>
    </div>
    <ol class="journey">
      <li class="rise" style="--i:1"><div class="where">Yemen</div><div class="what">Money is guarded carefully</div></li>
      <li class="rise" style="--i:2"><div class="where">Malaysia</div><div class="what">Paying is one tap</div></li>
      <li class="rise" style="--i:3"><div class="where">The risk</div><div class="what">One tap is enough for a thief</div></li>
      <li class="mark rise" style="--i:4"><div class="where">My answer</div><div class="what">MADD keeps checking</div></li>
    </ol>
    <aside class="notes">
      <p>I'm from Yemen. Back home, I learned early that keeping money safe is something you think about every day.</p>
      <p>When I came to Malaysia to study, e-wallets made paying and sending money very easy, just one tap. But I noticed that the same one tap is all a thief needs once they get into your phone.</p>
      <p>Security has always been very important to me, so I asked: what if the wallet kept checking after login, and asked me before anything unusual went through? I wanted to add that one feature, and keep paying just as easy as before.</p>
      <p>That's where the name comes from. In Arabic, the madda is the mark that extends a sound. MADD extends protection beyond the moment you log in.</p>
    </aside>
  </section>`,

  /* Agenda */
  `<section class="slide s-agenda" aria-label="Agenda">
    <div class="run"><span><b>Agenda</b></span><span class="num"></span></div>
    <h2 class="rise">Today: the problem, how I built MADD, and proof that it works.</h2>
    <ol class="agenda">
      <li class="rise" style="--i:1"><span class="n">01</span><b>The problem</b><span>Fraud after login</span></li>
      <li class="rise" style="--i:2"><span class="n">02</span><b>Aim and research</b><span>Objectives, similar systems, survey</span></li>
      <li class="rise" style="--i:3"><span class="n">03</span><b>Method and design</b><span>Increments, architecture, the 4 rules</span></li>
      <li class="main rise" style="--i:4"><span class="n">04 · Main part</span><b>The system, screen by screen</b><span>What the user sees, and what the server decides</span></li>
      <li class="rise" style="--i:5"><span class="n">05</span><b>Admin console</b><span>Flagged activity, logs, users</span></li>
      <li class="rise" style="--i:6"><span class="n">06</span><b>Security and testing</b><span>279 tests, speed, user testing</span></li>
      <li class="rise" style="--i:7"><span class="n">07</span><b>Demo and closing</b><span>Live on the phone, results, future work</span></li>
    </ol>
    <aside class="notes">
      <p>Here's the plan for today. First the problem, then my aim and research, then the method and design.</p>
      <p>The main part is the system itself: I'll go through the real screens and explain what the user sees and what the server decides.</p>
      <p>Then the admin console, security and testing, a live demo on my phone, and my conclusion.</p>
    </aside>
  </section>`,

  /* E-wallet growth and fraud */
  `<section class="slide s-figure" aria-label="E-wallet fraud is growing">
    <div class="run"><span><b>01</b> &nbsp;The problem</span><span class="num"></span></div>
    <h2 class="rise" style="margin-top:64px">As e-wallets grew, fraud grew with them.</h2>
    <div class="grid">
      <div class="rise" style="--i:1">
        <div class="figure">25<small>%</small></div>
        <p class="figure-cap">growth in digital payment fraud between 2020 and 2023, according to industry reports.</p>
      </div>
      <div class="facts">
        <div class="fact rise" style="--i:2"><b>The same convenience helps fraudsters</b><span>The ease that made e-wallets popular also makes them easy to misuse.</span></div>
        <div class="fact warn rise" style="--i:3"><b>Lost money is hard to get back</b><span>Once a fraudulent e-wallet transfer succeeds, the loss is often immediate and permanent.</span></div>
      </div>
    </div>
    <p class="source">Source: Investigation Report §1.1.1; <i>Vaz et al., 2022</i>.</p>
    <aside class="notes">
      <p>E-wallets are now mainstream, and fraud has grown with them. Industry reports show digital payment fraud grew by 25 percent between 2020 and 2023.</p>
      <p>The same convenience that made e-wallets popular makes them attractive to fraudsters. And unlike traditional banking, money lost through a fraudulent e-wallet transfer is often very hard or impossible to recover. Once it succeeds, the damage is done.</p>
    </aside>
  </section>`,

  /* Account takeover after login */
  `<section class="slide s-session" aria-label="Account takeover after login">
    <div class="run"><span><b>01</b> &nbsp;The problem</span><span class="num"></span></div>
    <h2 class="rise" style="margin-top:64px">Every login method protects one moment. Attackers act after it.</h2>
    <div class="methods">
      <div class="method rise" style="--i:1"><div class="kind">Password</div><b>Phished</b><p>Users are tricked into giving it away, <em>so the attacker logs in as them</em>.</p></div>
      <div class="method rise" style="--i:2"><div class="kind">PIN</div><b>Stolen with the password</b><p>Social engineering gets both, <em>and the account is taken over</em>.</p></div>
      <div class="method rise" style="--i:3"><div class="kind">Fingerprint or face</div><b>Can be fooled</b><p>Biometric checks can still be manipulated, <em>and they only guard the entry</em>.</p></div>
    </div>
    <div class="session rise" style="--i:4" aria-label="A session: only the login is checked">
      <div class="bar"><div class="in">Login check</div><div class="open">After login: nothing watches the transfers</div></div>
      <div class="ticks"><span>09:00</span><span><span>Transfer</span><span>Transfer</span><span>Change PIN</span><span>Transfer</span><span>Transfer</span></span></div>
    </div>
    <p class="source">Source: Investigation Report §1.1.2 and §1.1.3; <i>Jin &amp; Zhang, 2025</i>.</p>
    <aside class="notes">
      <p>The most common attack on e-wallets is account takeover. Fraudsters get the user's credentials, usually through phishing or social engineering, and then log in as them.</p>
      <p>Biometrics are often sold as the stronger option, but fingerprint and face recognition can also be manipulated.</p>
      <p>The bigger point is this bar. Every one of these methods only protects the moment of entry. After login, nothing looks at what the session does, whether it's the owner or an attacker.</p>
    </aside>
  </section>`,

  /* Research gap */
  `<section class="slide s-gap" aria-label="The gap MADD fills">
    <div class="run"><span><b>01</b> &nbsp;The problem · the gap</span><span class="num"></span></div>
    <h2 class="rise" style="margin-top:64px">Detection has to continue after login. Most e-wallets stop at the door.</h2>
    <div class="cmp">
      <section class="today rise" style="--i:1"><h3>Many e-wallets today</h3><ul>
        <li>Check the user once, at login</li>
        <li>Little or no checking of each transfer</li>
        <li>An attacker who gets in can act freely</li>
      </ul></section>
      <section class="madd rise" style="--i:2"><h3>What MADD adds</h3><ul>
        <li>Checks every transfer against 4 rules</li>
        <li>Holds anything unusual, in real time</li>
        <li>Asks the owner before money moves</li>
      </ul></section>
    </div>
    <p class="source">Source: Investigation Report §1.1.4; <i>Mathew, 2026</i>.</p>
    <aside class="notes">
      <p>Industry analysis agrees that fraud detection has to happen continuously, not only at the point of entry.</p>
      <p>But many e-wallets still rely mainly on login-time checks, with little or no checking during the transaction itself. That leaves a window where an attacker who gets in can act freely.</p>
      <p>That window is the problem MADD addresses: every transfer is checked, anything unusual is held, and the owner decides.</p>
    </aside>
  </section>`,
]);
