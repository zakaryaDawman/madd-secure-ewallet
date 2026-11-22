/* Part 4: the system, getting in and moving money. Marker heights are % of the 780×1688 design screens. */

/** File name of each design screen used in this part, by its number. */
const SCREEN = {
  "01": "01-Main", "02": "02-Login", "03": "03-Register", "04": "04-CreatePin", "05": "05-Home", "06": "06-Recipient",
  "07": "07-Amount", "08": "08-Review", "09": "09-Checking", "10": "10-Success", "11": "11-Held", "12": "12-NewDevice",
  "13": "13-LoginAlert", "14": "14-Frozen", "15": "15-Scan", "16": "16-Receive", "17": "17-History", "18": "18-Notifications",
  "19": "19-Profile", "26": "26-TxDetail", "27": "27-LoginLocked", "28": "28-SessionExpired", "29": "29-ConfirmHeldPin",
  "30": "30-FreezeConfirm", "31": "31-PinLocked", "32": "32-MoneyReceived", "33": "33-LowBalance", "34": "34-NoRecipient",
  "35": "35-HoldExpired", "36": "36-Welcome1", "37": "37-Welcome2", "38": "38-Welcome3", "39": "39-HomeNew", "40": "40-HomeLoading",
  "41": "41-ForgotPassword", "42": "42-PersonalDetails", "43": "43-ChangePin", "44": "44-Help", "45": "45-TrustDevice",
  "46": "46-Offline", "47": "47-NotifPermission",
};

/** One group of the screen map: title, subtitle, number of columns and its screen numbers. */
function mapGroup(title, subtitle, cols, numbers, i, extraClass = "") {
  const thumbs = numbers.map((n) => `<figure><img src="screens/${SCREEN[n]}.png" alt="Screen ${n}"><figcaption>${n}</figcaption></figure>`).join("");
  return `<div class="group ${extraClass} rise" style="--i:${i}"><h3>${title}</h3><p>${subtitle}</p><div class="grid" style="--cols:${cols}">${thumbs}</div></div>`;
}

/** A pin on the phone: number, height on the screen (%), colour and animation order. */
function pin(n, y, tone = "") {
  return `<span class="pin ${tone}" style="--y:${y};--i:${n}">${n}</span>`;
}

addPart([
  /* Screen map */
  `<section class="slide s-allmap" aria-label="All customer screens">
    <div class="run"><span><b>04</b> &nbsp;The system · every screen</span><span class="num"></span></div>
    <h2 class="rise">41 customer screens, each built to match the design.</h2>
    <div class="map">
      ${mapGroup("Get in", "Welcome, sign up, log in", 3, ["01", "36", "37", "38", "03", "04", "02", "41", "47"], 1)}
      ${mapGroup("Move money", "Balance, send, receive, history", 5, ["05", "39", "40", "06", "34", "07", "33", "08", "09", "10", "26", "16", "15", "17"], 2)}
      ${mapGroup("Stay safe", "Holds, devices, locks, freeze", 4, ["11", "29", "35", "12", "13", "45", "27", "31", "28", "14", "30"], 3, "sec")}
      ${mapGroup("Manage", "Inbox, profile, help", 3, ["18", "32", "19", "42", "43", "44", "46"], 4)}
    </div>
    <aside class="notes">
      <p>The app has 41 customer screens, every one built from my design, and checked against it in the screen check. Here they are grouped by what the user is trying to do.</p>
      <p>Getting in: the welcome slides, creating an account and PIN, logging in. Moving money: home, sending, receiving, scanning and history. Staying safe, in orange: what happens when a rule fires. And managing the account: inbox, profile and help.</p>
      <p>I'll go through the most important ones now.</p>
    </aside>
  </section>`,

  /* Get in flow */
  `<section class="slide s-flow" aria-label="Getting in flow">
    <div class="run"><span><b>04</b> &nbsp;The system · getting in</span><span class="num"></span></div>
    <h2 class="rise">Signing up takes four screens. The account is created only after the PIN.</h2>
    <div class="strip four">
      <figure class="rise" style="--i:1"><div class="phone"><img src="screens/36-Welcome1.png" alt="Welcome"></div><figcaption><i>36–38</i><b>Welcome</b><span>Three slides explain what MADD protects.</span></figcaption></figure>
      <figure class="rise" style="--i:2"><div class="phone"><img src="screens/03-Register.png" alt="Create account"></div><figcaption><i>03</i><b>Create account</b><span>Name, email, Malaysian phone, password with a strength bar.</span><span class="route">FR-1</span></figcaption></figure>
      <figure class="rise" style="--i:3"><div class="phone"><img src="screens/04-CreatePin.png" alt="Create PIN"></div><figcaption><i>04</i><b>Create PIN</b><span>6 digits, typed twice. Then the whole account is sent.</span><span class="route">POST /auth/register</span></figcaption></figure>
      <figure class="rise" style="--i:4"><div class="phone"><img src="screens/02-Login.png" alt="Log in"></div><figcaption><i>02</i><b>Log in</b><span>Starts a 30-minute session tied to this phone.</span><span class="route">POST /auth/login</span></figcaption></figure>
    </div>
    <aside class="notes">
      <p>A new user sees three welcome slides, then creates an account: full name, email, a Malaysian phone number and a password, with a strength bar while typing.</p>
      <p>Next they create a 6-digit PIN and type it again. Only then is the whole account sent to the server, in one request. The server stores the password and PIN only as bcrypt hashes, creates the wallet with RM 1,000 of demo money, and sends a welcome message to the inbox.</p>
      <p>Logging in starts a session of 30 minutes. The token carries the session id and this phone's device id, which the rules use later. Error messages never reveal whether an email exists.</p>
    </aside>
  </section>`,

  /* Home walkthrough */
  `<section class="slide s-walk" aria-label="Screen 05 Home">
    <div class="phone rise">
      <img src="screens/05-Home.png" alt="Home screen">
      ${pin(1, 9.3)}${pin(2, 20)}${pin(3, 28.6)}${pin(4, 38, "warn")}${pin(5, 60)}
    </div>
    <div class="side">
      <div class="run"><span><b>Screen 05</b> &nbsp;· Home</span><span class="num"></span></div>
      <h2 class="rise">Home shows the money, and anything waiting for you.</h2>
      <ol class="callouts">
        <li class="rise" style="--i:1"><span class="pin">1</span><div><h4>Protection on</h4><p>Tells the owner the 4 rules are watching this account.</p></div></li>
        <li class="rise" style="--i:2"><span class="pin">2</span><div><h4>Balance</h4><p>Read from the server every time; stored in whole sen, never as a decimal. The eye icon hides it in public.</p><div class="tags"><span class="tag">FR-3</span><span class="tag srv">GET /wallet</span></div></div></li>
        <li class="rise" style="--i:3"><span class="pin">3</span><div><h4>Send · Receive · Scan</h4><p>The three ways money moves.</p><div class="tags"><span class="tag">FR-4</span><span class="tag">FR-5</span></div></div></li>
        <li class="rise" style="--i:4"><span class="pin warn">4</span><div><h4>Transfer waiting for you</h4><p>Appears only when a rule has held a transfer, with the time left before it is cancelled.</p><div class="tags"><span class="tag">FR-15</span><span class="tag srv">Server decides</span></div></div></li>
        <li class="rise" style="--i:5"><span class="pin">5</span><div><h4>Recent activity</h4><p>The last transfers in and out, with names masked by the server.</p><div class="tags"><span class="tag">FR-6</span></div></div></li>
      </ol>
    </div>
    <aside class="notes">
      <p>This is Home. One: "Protection on" tells the user the rules are active.</p>
      <p>Two: the balance comes from the server every time; the app never calculates it. It's stored as whole sen, so RM 1,240.50 is 124,050 sen, with no rounding errors.</p>
      <p>Three: Send, Receive and Scan. Four: this orange card only appears when a rule has held a transfer; it shows how long the owner has left to decide. Five: recent activity, with names masked by the server.</p>
    </aside>
  </section>`,

  /* Send money flow */
  `<section class="slide s-flow" aria-label="Sending money flow">
    <div class="run"><span><b>04</b> &nbsp;The system · sending money</span><span class="num"></span></div>
    <h2 class="rise">Sending money takes five screens. The checks happen on the fourth.</h2>
    <div class="strip">
      <figure class="rise" style="--i:1"><div class="phone"><img src="screens/06-Recipient.png" alt="Choose recipient"></div><figcaption><i>06</i><b>Choose who</b><span>Phone number or a recent person. The name comes back masked.</span><span class="route">GET /users/lookup</span></figcaption></figure>
      <figure class="rise" style="--i:2"><div class="phone"><img src="screens/07-Amount.png" alt="Enter amount"></div><figcaption><i>07</i><b>Enter amount</b><span>Own keypad, RM 1 to RM 50,000, balance shown.</span></figcaption></figure>
      <figure class="rise" style="--i:3"><div class="phone"><img src="screens/08-Review.png" alt="Review and PIN"></div><figcaption><i>08</i><b>Review + PIN</b><span>6-digit PIN, checked against a bcrypt hash.</span><span class="route">FR-7</span></figcaption></figure>
      <figure class="rise" style="--i:4"><div class="phone"><img src="screens/09-Checking.png" alt="Checking"></div><figcaption><i>09</i><b>Checking</b><span>Server locks both wallets and runs the rules.</span><span class="route">POST /transfers</span></figcaption></figure>
      <figure class="rise" style="--i:5"><div class="phone"><img src="screens/10-Success.png" alt="Money sent"></div><figcaption><i>10</i><b>Sent, or held</b><span>No rule fired: receipt. A rule fired: screen 11.</span><span class="route">FR-4</span></figcaption></figure>
    </div>
    <aside class="notes">
      <p>Sending money. First, choose who: by phone number or from recent people. The server returns the name masked, like "Ahm*** Ali", and limits lookups to 10 a minute so nobody can scan the user list.</p>
      <p>Then the amount, from RM 1 to RM 50,000, with the balance shown. If it's more than the balance, the app shows the low-balance state, screen 33; an unknown number shows screen 34.</p>
      <p>On review, the user enters their PIN. Then the server does everything in one database transaction: checks the PIN, locks both wallets, checks the balance and runs the rules. If no rule fires, the money moves and the receipt appears. If a rule fires, nothing moves and the user sees the held screen.</p>
    </aside>
  </section>`,

  /* Receive and scan */
  `<section class="slide s-pair" aria-label="Screens 16 and 15 Receive and Scan">
    <div class="phone rise"><img src="screens/16-Receive.png" alt="Receive money">${pin(1, 27.3)}${pin(2, 44.4)}${pin(3, 84.1)}</div>
    <div class="phone rise" style="--i:1"><img src="screens/15-Scan.png" alt="Scan to send">${pin(4, 9.2)}${pin(5, 42.7)}${pin(6, 71.7)}</div>
    <div class="side">
      <div class="run"><span><b>Screens 16 + 15</b> &nbsp;· Receive and scan</span><span class="num"></span></div>
      <h2 class="rise">A QR code carries only a phone number. Scans pass the same checks.</h2>
      <div class="two-lists">
        <ol class="callouts">
          <li class="callout-head">Receive · 16</li>
          <li class="rise" style="--i:1"><span class="pin">1</span><div><h4>Name and number</h4><p>Tap to copy the number.</p></div></li>
          <li class="rise" style="--i:2"><span class="pin">2</span><div><h4>My QR code</h4><p>Only the phone number. No balance, no account details.</p><div class="tags"><span class="tag">FR-5</span></div></div></li>
          <li class="rise" style="--i:3"><span class="pin">3</span><div><h4>Share or save</h4><p>Send it in any app, or save it to the gallery.</p></div></li>
        </ol>
        <ol class="callouts">
          <li class="callout-head">Scan · 15</li>
          <li class="rise" style="--i:4"><span class="pin">4</span><div><h4>Flash</h4><p>For scanning in the dark.</p></div></li>
          <li class="rise" style="--i:5"><span class="pin">5</span><div><h4>Camera</h4><p>Opens the normal Amount screen. Other QR codes are refused.</p><div class="tags"><span class="tag">FR-4</span></div></div></li>
          <li class="rise" style="--i:6"><span class="pin">6</span><div><h4>From gallery</h4><p>Reads a QR from a saved picture.</p></div></li>
        </ol>
      </div>
    </div>
    <aside class="notes">
      <p>To receive money, the user shows this QR code. It holds only their phone number, nothing else, so sharing it is safe. They can copy the number, share the QR, or save it as an image.</p>
      <p>To pay someone, they scan with the camera, use the flash in the dark, or pick a QR from the gallery. A valid MADD QR goes straight into the normal Amount screen, so a scanned payment passes exactly the same PIN check and the same four rules as any other transfer.</p>
    </aside>
  </section>`,

  /* History walkthrough */
  `<section class="slide s-walk" aria-label="Screen 17 History">
    <div class="phone rise">
      <img src="screens/17-History.png" alt="History">
      ${pin(1, 14.8)}${pin(2, 20.4)}${pin(3, 25.9, "warn")}${pin(4, 54.9, "bad")}${pin(5, 75.7)}
    </div>
    <div class="side">
      <div class="run"><span><b>Screen 17</b> &nbsp;· History</span><span class="num"></span></div>
      <h2 class="rise">History shows every transfer, including the ones that never went through.</h2>
      <ol class="callouts">
        <li class="rise" style="--i:1"><span class="pin">1</span><div><h4>All · In · Out · Held</h4><p>Filters, so a held transfer is easy to find.</p><div class="tags"><span class="tag">FR-6</span><span class="tag srv">GET /transactions</span></div></div></li>
        <li class="rise" style="--i:2"><span class="pin">2</span><div><h4>Grouped by day</h4><p>Newest first: Today, Yesterday, then the date.</p></div></li>
        <li class="rise" style="--i:3"><span class="pin warn">3</span><div><h4>Waiting for you</h4><p>A held transfer. No money has moved yet.</p><div class="tags"><span class="tag">FR-15</span></div></div></li>
        <li class="rise" style="--i:4"><span class="pin bad">4</span><div><h4>Cancelled</h4><p>Not confirmed in time, so the amount is struck through. The balance never changed.</p></div></li>
        <li class="rise" style="--i:5"><span class="pin">5</span><div><h4>Tap any row</h4><p>Opens the full details (screen 26). The server only returns your own transfers.</p><div class="tags"><span class="tag srv">GET /transactions/:id</span></div></div></li>
      </ol>
    </div>
    <aside class="notes">
      <p>History lists every transfer, newest first, grouped by day, with filters for money in, money out and held.</p>
      <p>Number three is a held transfer: it says "Waiting for you" and no money has moved. Number four was cancelled because the owner didn't confirm within five minutes; the amount is struck through, and the balance never changed.</p>
      <p>Tapping a row opens the details. The server only ever returns the user's own transfers; asking for someone else's gives "not found". That's tested.</p>
    </aside>
  </section>`,
]);
