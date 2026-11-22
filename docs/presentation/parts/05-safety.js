/* Part 5: staying safe. One slide per rule shows what the user sees and what the server did.
   Reason texts are copied from server/src/rules/. Uses pin() from 04-system.js. */
addPart([
  /* Held transfer: R1 and R2 */
  `<section class="slide s-walk" aria-label="Screen 11 Held transfer, rules R1 and R2">
    <div class="phone rise">
      <img src="screens/11-Held.png" alt="Held transfer">
      ${pin(1, 22, "warn")}${pin(2, 48)}${pin(3, 67.5, "warn")}${pin(4, 83.6)}${pin(5, 91.7, "bad")}
    </div>
    <div class="side">
      <div class="run"><span><b>Screen 11</b> &nbsp;· Held transfer · R1 and R2</span><span class="num"></span></div>
      <h2 class="rise">When R1 or R2 fires, no money moves until the owner decides.</h2>
      <ol class="callouts">
        <li class="rise" style="--i:1"><span class="pin warn">1</span><div><h4>5-minute countdown</h4><p>Checked by the server when read, not by a timer on the phone.</p></div></li>
        <li class="rise" style="--i:2"><span class="pin">2</span><div><h4>What was paused</h4><p>Recipient (masked), amount, and the phone it came from.</p></div></li>
        <li class="rise" style="--i:3"><span class="pin warn">3</span><div><h4>Why we paused it</h4><p>Plain words built from the rule's own numbers:</p>
          <div class="reasons"><div class="reason"><b>R1</b>RM 800.00 is more than 3 times your usual transfer, and above your safe limit of RM 500.00.</div><div class="reason"><b>R2</b>4 transfers in 5 minutes is faster than usual.</div></div></div></li>
        <li class="rise" style="--i:4"><span class="pin">4</span><div><h4>Yes, it was me</h4><p>PIN, then the transfer goes through.</p><div class="tags"><span class="tag">FR-15</span></div></div></li>
        <li class="rise" style="--i:5"><span class="pin bad">5</span><div><h4>No, freeze my account</h4><p>Cancels it and locks the account.</p></div></li>
      </ol>
    </div>
    <aside class="notes">
      <p>This is what the user sees when R1 or R2 fires. On the server, the transfer was saved as pending, no money moved, the event was written to the security log, and a push alert went to the owner's trusted phones.</p>
      <p>One: a five-minute countdown. The server checks the time whenever the transfer is read, so it doesn't depend on the phone. Two: what was paused. Three: why, in plain words, built from the rule's own numbers. For R1 it compares the amount with the user's average and the RM 500 floor; for R2 it says four transfers in five minutes is faster than usual.</p>
      <p>Four and five: the owner decides. I'll show both paths on the next slide.</p>
    </aside>
  </section>`,

  /* Yes / No / no answer */
  `<section class="slide s-flow" aria-label="Yes, No or no answer">
    <div class="run"><span><b>04</b> &nbsp;The system · the owner decides</span><span class="num"></span></div>
    <h2 class="rise">Three ways a held transfer can end. Money moves in only one.</h2>
    <div class="paths">
      <figure class="rise" style="--i:1"><span class="path-tag start">Held</span><div class="phone"><img src="screens/11-Held.png" alt="Held transfer"></div><figcaption><b>Was this you?</b><span>The owner sees the hold on a trusted phone.</span></figcaption></figure>
      <figure class="rise" style="--i:2"><span class="path-tag yes">Yes</span><div class="phone"><img src="screens/29-ConfirmHeldPin.png" alt="Confirm with PIN"></div><figcaption><b>Confirm with PIN</b><span>Wallets locked, balance checked again, sent exactly once.</span><span class="route">POST /transfers/:id/confirm</span></figcaption></figure>
      <figure class="rise" style="--i:3"><span class="path-tag no">No</span><div class="phone"><img src="screens/14-Frozen.png" alt="Account frozen"></div><figcaption><b>Account frozen</b><span>Cancelled, account frozen, every session on every phone ended.</span><span class="route">POST /transfers/:id/reject</span></figcaption></figure>
      <figure class="rise" style="--i:4"><span class="path-tag wait">No answer</span><div class="phone"><img src="screens/35-HoldExpired.png" alt="Transfer cancelled"></div><figcaption><b>Cancelled after 5 min</b><span>Marked expired. The balance never changed.</span><span class="route">FR-15</span></figcaption></figure>
    </div>
    <aside class="notes">
      <p>A held transfer can end in three ways, and money moves in only one of them.</p>
      <p>Yes: the owner enters their PIN. The server locks both wallets again and re-checks the balance, because it may have changed during the five minutes, and then sends the money exactly once, even if the button is pressed twice.</p>
      <p>No: the transfer is cancelled, the account is frozen, and every session on every phone is ended, so an attacker is logged out immediately. Only an admin can unfreeze it.</p>
      <p>No answer: after five minutes the transfer expires. Nothing moved. Every outcome is written to the security log.</p>
    </aside>
  </section>`,

  /* New device: R3 */
  `<section class="slide s-flow" aria-label="New device, rule R3">
    <div class="run"><span><b>04</b> &nbsp;The system · new device · R3</span><span class="num"></span></div>
    <h2 class="rise">A new phone can sign in. It can't move money until the usual phone says yes.</h2>
    <div class="paths">
      <figure class="rise" style="--i:1"><span class="path-tag start">New phone</span><div class="phone"><img src="screens/12-NewDevice.png" alt="Approve on your usual phone"></div><figcaption><b>Approve on your usual phone</b><span>Its transfers wait. A request goes to the trusted phone.</span></figcaption></figure>
      <figure class="rise" style="--i:2"><span class="path-tag wait">Usual phone</span><div class="phone"><img src="screens/13-LoginAlert.png" alt="New device signed in alert"></div><figcaption><b>New device signed in</b><span>Push alert, then Yes, trust it, or No, freeze.</span><span class="route">POST /me/devices/:id/reject</span></figcaption></figure>
      <figure class="rise" style="--i:3"><span class="path-tag yes">Yes</span><div class="phone"><img src="screens/45-TrustDevice.png" alt="Trust this device with PIN"></div><figcaption><b>Trust with PIN</b><span>"Only trust phones you own."</span><span class="route">POST /me/devices/:id/trust</span></figcaption></figure>
      <div class="server-box rise" style="--i:4"><h4>WHAT THE SERVER DID</h4><ol>
        <li>Login records the phone's id in <code>known_devices</code>.</li>
        <li>Not trusted → R3 fires: "This phone is not one of your trusted devices."</li>
        <li>Alert sent to <b>trusted phones only</b>, never to the new one.</li>
        <li>R3 runs again on every transfer from that phone.</li>
      </ol><span class="route" style="margin-top:auto">FR-9 · FR-13</span></div>
    </div>
    <aside class="notes">
      <p>R3 handles a new phone. If someone logs in on a phone MADD hasn't seen before, they are let in, but it's untrusted: any transfer from it waits, and the screen says to approve on the usual phone.</p>
      <p>The usual, trusted phone gets a push alert: "New device signed in". The owner can trust it with their PIN, or say no, which freezes the account and logs out every phone.</p>
      <p>The key point: the alert only goes to trusted phones. If an attacker logs in with stolen details, they can't approve themselves.</p>
    </aside>
  </section>`,

  /* Locks: R4 and the PIN lock */
  `<section class="slide s-pair" aria-label="Screens 27 and 31, rule R4 and the PIN lock">
    <div class="phone rise"><img src="screens/27-LoginLocked.png" alt="Too many wrong passwords">${pin(1, 29.4, "bad")}${pin(2, 46.2)}${pin(3, 60.7)}</div>
    <div class="phone rise" style="--i:1"><img src="screens/31-PinLocked.png" alt="Transfers locked">${pin(4, 21.3, "bad")}${pin(5, 49.8, "bad")}${pin(6, 84.4)}</div>
    <div class="side">
      <div class="run"><span><b>Screens 27 + 31</b> &nbsp;· R4 and the PIN lock</span><span class="num"></span></div>
      <h2 class="rise">Guessing is stopped twice: at sign&#8209;in, and at the PIN.</h2>
      <div class="two-lists">
        <ol class="callouts">
          <li class="callout-head">R4 · sign-in · 27</li>
          <li class="rise" style="--i:1"><span class="pin bad">1</span><div><h4>Locked</h4><p>5 wrong passwords in 15 minutes.</p><div class="tags"><span class="tag">FR-14</span></div></div></li>
          <li class="rise" style="--i:2"><span class="pin">2</span><div><h4>Countdown</h4><p>15 minutes, set by the server.</p></div></li>
          <li class="rise" style="--i:3"><span class="pin">3</span><div><h4>Owner alerted</h4><p>Push to the trusted phone. Same reply for unknown emails.</p></div></li>
        </ol>
        <ol class="callouts">
          <li class="callout-head">PIN lock · 31</li>
          <li class="rise" style="--i:4"><span class="pin bad">4</span><div><h4>Tries left</h4><p>The server counts wrong PINs in a row.</p><div class="tags"><span class="tag">FR-7</span></div></div></li>
          <li class="rise" style="--i:5"><span class="pin bad">5</span><div><h4>Transfers locked</h4><p>After 5, for 15 minutes. Balance still visible.</p></div></li>
          <li class="rise" style="--i:6"><span class="pin">6</span><div><h4>Not you?</h4><p>Freeze the account, no PIN needed while locked.</p></div></li>
        </ol>
      </div>
    </div>
    <aside class="notes">
      <p>Two locks stop guessing. On the left, R4: five wrong passwords within fifteen minutes lock sign-in for fifteen minutes. The countdown comes from the server, and the owner's trusted phone is alerted. The reply is the same whether the email exists or not, so an attacker can't use it to find accounts.</p>
      <p>On the right, the PIN lock: the server counts wrong PINs and shows how many tries are left. After five in a row, transfers are locked for fifteen minutes. The user can still see their balance and history. If it wasn't them, they can freeze the account straight away; while the PIN is locked, no PIN is needed for that.</p>
    </aside>
  </section>`,

  /* Inbox: Security tab */
  `<section class="slide s-walk" aria-label="Screen 18 Inbox, Security tab">
    <div class="phone rise">
      <img src="screens/18-Notifications.png" alt="Inbox, Security tab">
      ${pin(1, 15.4)}${pin(2, 27, "warn")}${pin(3, 49.2)}${pin(4, 65.8, "bad")}${pin(5, 90.6)}
    </div>
    <div class="side">
      <div class="run"><span><b>Screen 18</b> &nbsp;· Inbox · Security</span><span class="num"></span></div>
      <h2 class="rise">Every alert is also kept in the Inbox, so nothing depends on one push.</h2>
      <ol class="callouts">
        <li class="rise" style="--i:1"><span class="pin">1</span><div><h4>All · Security</h4><p>Security shows only rule alerts, with a count.</p><div class="tags"><span class="tag">FR-15</span><span class="tag srv">GET /notifications</span></div></div></li>
        <li class="rise" style="--i:2"><span class="pin warn">2</span><div><h4>Transfer waiting for you</h4><p>Yes and No right on the card, with the time left.</p></div></li>
        <li class="rise" style="--i:3"><span class="pin">3</span><div><h4>New device signed in</h4><p>R3, with what the owner decided.</p></div></li>
        <li class="rise" style="--i:4"><span class="pin bad">4</span><div><h4>5 wrong password attempts</h4><p>R4, with a direct Freeze my account link.</p></div></li>
        <li class="rise" style="--i:5"><span class="pin">5</span><div><h4>Unread dot</h4><p>Until the owner opens the Inbox.</p><div class="tags"><span class="tag srv">GET /notifications/unread</span></div></div></li>
      </ol>
    </div>
    <aside class="notes">
      <p>A push can be missed, so every alert is also saved in the Inbox. The Security tab shows only rule alerts.</p>
      <p>A waiting transfer has Yes and No right on the card. New-device and wrong-password alerts are kept here too, with a direct link to freeze the account. The red dot stays until the user opens the Inbox.</p>
      <p>This also answers my survey: most people preferred in-app alerts, and this is the in-app side.</p>
    </aside>
  </section>`,

  /* Profile and freeze (optional) */
  `<section class="slide s-flow" aria-label="Profile and Freeze my account (optional)">
    <div class="run"><span><b>04</b> &nbsp;The system · freeze my account (optional)</span><span class="num"></span></div>
    <h2 class="rise">The owner can freeze the account at any time. Only an admin can unfreeze it.</h2>
    <div class="paths" style="grid-template-columns: repeat(3, 1fr); padding: 0 420px">
      <figure class="rise" style="--i:1"><span class="path-tag wait">Profile</span><div class="phone"><img src="screens/19-Profile.png" alt="Profile"></div><figcaption><b>Profile</b><span>My devices, Change PIN, Help, and Freeze my account.</span></figcaption></figure>
      <figure class="rise" style="--i:2"><span class="path-tag no">Freeze</span><div class="phone"><img src="screens/30-FreezeConfirm.png" alt="Freeze my account"></div><figcaption><b>Confirm</b><span>PIN needed, except while the PIN is locked or on a trusted phone.</span><span class="route">POST /me/freeze</span></figcaption></figure>
      <figure class="rise" style="--i:3"><span class="path-tag no">Frozen</span><div class="phone"><img src="screens/14-Frozen.png" alt="Account frozen"></div><figcaption><b>Frozen</b><span>Every session ends. Unfreezing needs an admin and a written reason.</span></figcaption></figure>
    </div>
    <aside class="notes">
      <p>If the owner ever suspects something, for example a lost phone, they can freeze the account from Profile. This reuses the same freeze as "No" on a held transfer: every session on every phone ends straight away.</p>
      <p>Freezing needs the PIN, unless the PIN is locked or the request comes from a trusted phone, so a locked-out owner can still protect themselves. Only an admin can unfreeze, and must write a reason, which is logged. I'll show that in the admin part.</p>
    </aside>
  </section>`,
]);
