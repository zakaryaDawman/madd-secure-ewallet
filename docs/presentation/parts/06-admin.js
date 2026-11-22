/* Part 6: admin console. Shown with the admin designs (20–25, 48); the web console uses the same content with a side menu.
   Figures on these screens are design examples, not live data. Uses pin() from 04-system.js. */
addPart([
  /* Dashboard */
  `<section class="slide s-walk" aria-label="Screen 20 Admin dashboard">
    <div class="phone rise">
      <img src="screens/20-AdminDashboard.png" alt="Admin dashboard">
      ${pin(1, 10.8)}${pin(2, 27.3, "warn")}${pin(3, 49.8)}${pin(4, 67)}${pin(5, 94.2)}
    </div>
    <div class="side">
      <div class="run"><span><b>05</b> &nbsp;Admin console · screen 20</span><span><span class="ex">Design · example figures</span> &nbsp;<span class="num"></span></span></div>
      <h2 class="rise">Staff see the whole picture in one place, and only staff can.</h2>
      <ol class="callouts">
        <li class="rise" style="--i:1"><span class="pin">1</span><div><h4>Admin only</h4><p>A separate web console. The server checks the admin role in the database on every request; customers get 403.</p><div class="tags"><span class="tag">FR-17</span><span class="tag">FR-20</span></div></div></li>
        <li class="rise" style="--i:2"><span class="pin warn">2</span><div><h4>Today at a glance</h4><p>Alerts today, transfers held now, frozen accounts, locked sign-ins.</p><div class="tags"><span class="tag srv">GET /admin/stats</span></div></div></li>
        <li class="rise" style="--i:3"><span class="pin">3</span><div><h4>Alerts by rule</h4><p>Last 7 days, R1 to R4, to see which rule fires most.</p></div></li>
        <li class="rise" style="--i:4"><span class="pin">4</span><div><h4>Latest events</h4><p>Who, which rule, and when.</p></div></li>
        <li class="rise" style="--i:5"><span class="pin">5</span><div><h4>Dashboard · Flagged · Logs · Users</h4><p>On the web this bar becomes a left side menu.</p></div></li>
      </ol>
    </div>
    <aside class="notes">
      <p>The admin side is a separate web console, not part of the phone app. Admins can't use the phone app, and customers can never reach the admin routes: the server checks the role in the database on every request.</p>
      <p>The dashboard shows today at a glance: alerts, held transfers, frozen accounts and locked sign-ins, then alerts by rule over the last seven days, and the latest events. These figures are design examples; in the real console they come from GET /admin/stats.</p>
    </aside>
  </section>`,

  /* Flagged → details */
  `<section class="slide s-pair" aria-label="Screens 21 and 48 Flagged activity and event details">
    <div class="phone rise"><img src="screens/21-AdminFlagged.png" alt="Flagged activity">${pin(1, 16)}${pin(2, 27.4, "warn")}${pin(3, 33.5)}</div>
    <div class="phone rise" style="--i:1"><img src="screens/48-AdminFlagDetail.png" alt="Event details">${pin(4, 50, "warn")}${pin(5, 66)}${pin(6, 78, "bad")}</div>
    <div class="side">
      <div class="run"><span><b>05</b> &nbsp;Admin · screens 21 + 48</span><span><span class="ex">Design · example figures</span> &nbsp;<span class="num"></span></span></div>
      <h2 class="rise">Every flag shows the exact maths the server used.</h2>
      <div class="two-lists">
        <ol class="callouts">
          <li class="callout-head">Flagged · 21</li>
          <li class="rise" style="--i:1"><span class="pin">1</span><div><h4>Filters</h4><p>By rule, or only pending.</p><div class="tags"><span class="tag srv">GET /admin/flagged</span></div></div></li>
          <li class="rise" style="--i:2"><span class="pin warn">2</span><div><h4>Status</h4><p>Pending, Confirmed, Rejected, Expired or Locked.</p><div class="tags"><span class="tag">FR-18</span></div></div></li>
          <li class="rise" style="--i:3"><span class="pin">3</span><div><h4>Context</h4><p>Usual amount, device, time.</p></div></li>
        </ol>
        <ol class="callouts">
          <li class="callout-head">Details · 48</li>
          <li class="rise" style="--i:4"><span class="pin warn">4</span><div><h4>Why it fired</h4><p>The rule saves its numbers when it fires.</p></div></li>
          <li class="rise" style="--i:5"><span class="pin">5</span><div><h4>Timeline</h4><p>Held, alert sent, answer, to the second.</p><div class="tags"><span class="tag">FR-16</span></div></div></li>
          <li class="rise" style="--i:6"><span class="pin bad">6</span><div><h4>Read-only</h4><p>Admins can't approve or cancel.</p></div></li>
        </ol>
      </div>
    </div>
    <aside class="notes">
      <p>Flagged activity lists every rule that fired, filtered by rule or by status. Each card shows the context: the usual amount, the device, the time.</p>
      <p>Opening one shows the details. The important part is "why the rule fired": when a rule fires, it saves the numbers it used, so the admin sees the same calculation the server made, here RM 800 against a limit of RM 500. Then the timeline: submitted, held, alert sent, the owner's answer.</p>
      <p>This is read-only on purpose. The decision belongs to the owner, not the admin. The security log behind it is append-only, enforced by a database trigger, and the full log is on the Logs page with search.</p>
    </aside>
  </section>`,

  /* Users → unfreeze */
  `<section class="slide s-pair" aria-label="Screens 23 and 25 User details and unfreeze">
    <div class="phone rise"><img src="screens/23-AdminUsers.png" alt="User details">${pin(1, 40.9)}${pin(2, 65.2, "bad")}${pin(3, 85.1, "bad")}</div>
    <div class="phone rise" style="--i:1"><img src="screens/25-AdminUnfreeze.png" alt="Unfreeze with reason">${pin(4, 51.5)}${pin(5, 71.1, "warn")}${pin(6, 82)}</div>
    <div class="side">
      <div class="run"><span><b>05</b> &nbsp;Admin · screens 23 + 25</span><span><span class="ex">Design · example figures</span> &nbsp;<span class="num"></span></span></div>
      <h2 class="rise">Admins can freeze, unfreeze and trust. They can never touch the money.</h2>
      <div class="two-lists">
        <ol class="callouts">
          <li class="callout-head">User · 23</li>
          <li class="rise" style="--i:1"><span class="pin">1</span><div><h4>Devices</h4><p>Trust a device for the user.</p></div></li>
          <li class="rise" style="--i:2"><span class="pin bad">2</span><div><h4>Limits</h4><p>No moving money, no balance changes, no PINs.</p><div class="tags"><span class="tag">FR-17</span></div></div></li>
          <li class="rise" style="--i:3"><span class="pin bad">3</span><div><h4>Freeze</h4><p>Ends all the user's sessions.</p></div></li>
        </ol>
        <ol class="callouts">
          <li class="callout-head">Unfreeze · 25</li>
          <li class="rise" style="--i:4"><span class="pin">4</span><div><h4>Who froze it, and why</h4><p>User or admin, time, rule.</p></div></li>
          <li class="rise" style="--i:5"><span class="pin warn">5</span><div><h4>Reason required</h4><p>At least 10 characters, checked by the server too.</p></div></li>
          <li class="rise" style="--i:6"><span class="pin">6</span><div><h4>Logged</h4><p>Saved with the admin's id.</p><div class="tags"><span class="tag srv">security_events</span></div></div></li>
        </ol>
      </div>
    </div>
    <aside class="notes">
      <p>The Users page lists every customer; opening one shows their status, devices and recent security events.</p>
      <p>Admins have only three actions: freeze, unfreeze, and trust a device. They cannot move money, change a balance or see a PIN. The server simply has no route for that.</p>
      <p>Every admin action needs a written reason of at least 10 characters; the button stays off until there is one, and the server checks it again. The reason, and which admin did it, go into the append-only security log. So even the admin is accountable.</p>
    </aside>
  </section>`,
]);
