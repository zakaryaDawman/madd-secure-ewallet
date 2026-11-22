/* Speaker notes, slides 28–50: simple English, then Arabic. Adds to NOTES from notes-1.js. */
Object.assign(NOTES, {
  "Screen 20 Admin dashboard": {
    en: ["This is the admin website. Only staff can use it.", "The server checks the role in the database every time. Customers get blocked.", "The dashboard shows today's alerts, waiting transfers and frozen accounts.", "The numbers on this design are examples."],
    ar: ["هذا موقع المشرف، ويستخدمه الموظفون فقط.", "الخادم يفحص الصلاحية من قاعدة البيانات في كل مرة، والعملاء يُمنعون.", "لوحة التحكم تعرض تنبيهات اليوم، والتحويلات المنتظرة، والحسابات المجمّدة.", "الأرقام في هذا التصميم أمثلة فقط."],
  },
  "Screens 21 and 48 Flagged activity and event details": {
    en: ["Here the admin sees every rule that fired.", "The details show the exact numbers the server used. For example, RM 800 is more than the RM 500 limit.", "The admin can only look. The admin cannot approve or cancel a transfer."],
    ar: ["هنا يرى المشرف كل قاعدة انطبقت.", "التفاصيل تعرض الأرقام الدقيقة التي استخدمها الخادم، مثلًا 800 رنجت أكثر من حد 500 رنجت.", "المشرف يشاهد فقط، ولا يستطيع الموافقة على تحويل أو إلغاءه."],
  },
  "Screens 23 and 25 User details and unfreeze": {
    en: ["The admin can freeze, unfreeze, or trust a phone. That is all.", "The admin can never move money, change a balance, or see a PIN.", "Every admin action needs a written reason. It is saved in the security log."],
    ar: ["المشرف يستطيع التجميد، وفكّ التجميد، والوثوق بجوال. هذا فقط.", "المشرف لا يستطيع أبدًا تحويل المال، أو تغيير الرصيد، أو رؤية الرقم السري.", "كل إجراء للمشرف يحتاج سببًا مكتوبًا، ويُحفظ في سجل الأمان."],
  },
  "How the server protects money": {
    en: ["Here are six protections. All of them are on the server.", "So even a changed, fake app cannot skip them.", "Money is saved as whole numbers. Two transfers cannot use the same money. Passwords are scrambled. Sessions end after 30 minutes. The log cannot be edited.", "One thing is not done yet: HTTPS. It comes when the server goes online."],
    ar: ["هذه ست حمايات، كلها في الخادم.", "لذلك حتى التطبيق المزيّف المعدّل لا يستطيع تجاوزها.", "المال يُحفظ كأرقام صحيحة، وتحويلان لا يستخدمان نفس المال، وكلمات المرور مشفّرة، والجلسة تنتهي بعد 30 دقيقة، والسجل لا يُعدَّل.", "شيء واحد لم يكتمل بعد: HTTPS، وسيأتي عندما يُرفع الخادم على الإنترنت."],
  },
  "Attacking MADD overview": {
    en: ["I study cybersecurity, so I attacked my own system. 11 times.", "I used a script and test accounts. All the replies you will see are real.", "This row is every check on the server. Each attack is under the check that stopped it.", "Now I will go through the main attacks, step by step."],
    ar: ["أنا أدرس الأمن السيبراني، لذلك هاجمتُ نظامي بنفسي، 11 مرة.", "استخدمتُ سكربت وحسابات تجريبية، وكل الردود التي سترونها حقيقية.", "هذا الصف هو كل فحوصات الخادم، وكل هجوم موضوع تحت الفحص الذي أوقفه.", "الآن سأشرح أهم الهجمات خطوة بخطوة."],
  },
  "Attack 1: forged token": {
    en: ["Attack 1. The attacker changes the login token to say 'admin'.", "But the token has a secret signature. Only the server knows the secret.", "The signature does not match, so the server says 401: not allowed."],
    ar: ["الهجوم 1: المهاجم يغيّر رمز الدخول ليقول إنه مشرف.", "لكن الرمز عليه توقيع سري، والخادم وحده يعرف السر.", "التوقيع لا يتطابق، فيرد الخادم بـ 401: غير مسموح."],
  },
  "Attack 2: token replay": {
    en: ["Attack 2. The attacker copies a token. The owner logs out. The attacker uses the copy.", "The server checks the session in the database every time. The session is closed.", "So the copy is useless. The reply is 401."],
    ar: ["الهجوم 2: المهاجم ينسخ رمز الدخول، ثم يسجّل صاحب الحساب خروجه، فيستخدم المهاجم النسخة.", "الخادم يفحص الجلسة في قاعدة البيانات كل مرة، والجلسة مغلقة.", "فالنسخة لا فائدة منها، والرد 401."],
  },
  "Attack 3: admin routes": {
    en: ["Attack 3. A normal customer tries to open admin pages.", "The server checks the role in the database, not in the token.", "The reply is 403: forbidden."],
    ar: ["الهجوم 3: عميل عادي يحاول فتح صفحات المشرف.", "الخادم يفحص الصلاحية من قاعدة البيانات، وليس من الرمز.", "الرد 403: ممنوع."],
  },
  "Attack 4: bad amounts": {
    en: ["Attack 4. The attacker sends a minus amount, to pull money in. Then a broken number.", "The server checks every number. It must be a whole number, from RM 1 to RM 50,000.", "Both are refused with 400. No money code runs."],
    ar: ["الهجوم 4: المهاجم يرسل مبلغًا سالبًا ليسحب المال إليه، ثم رقمًا بكسور.", "الخادم يفحص كل رقم، ويجب أن يكون رقمًا صحيحًا من 1 إلى 50,000 رنجت.", "الاثنان يُرفضان بـ 400، ولا يعمل أي كود للمال."],
  },
  "Attack 7: double spend": {
    en: ["Attack 7. The attacker has RM 550 and sends RM 450 two times, at the same moment.", "The server locks the wallet. The second transfer waits, then sees only RM 100 left.", "So one transfer goes, and one is refused. The balance never goes below zero."],
    ar: ["الهجوم 7: المهاجم عنده 550 رنجت، ويرسل 450 رنجت مرتين في نفس اللحظة.", "الخادم يقفل المحفظة، فينتظر التحويل الثاني ثم يرى أن الباقي 100 رنجت فقط.", "فيمرّ تحويل واحد ويُرفض الآخر، والرصيد لا ينزل تحت الصفر أبدًا."],
  },
  "Attack 8: PIN guessing": {
    en: ["Attack 8. The attacker guesses the PIN again and again.", "The server counts wrong tries: 4 left, 3, 2, 1.", "After 5 wrong tries, transfers lock for 15 minutes. The owner gets an alert."],
    ar: ["الهجوم 8: المهاجم يخمّن الرقم السري مرة بعد مرة.", "الخادم يعدّ المحاولات الخاطئة: باقي 4، ثم 3، ثم 2، ثم 1.", "بعد 5 محاولات خاطئة تُقفل التحويلات 15 دقيقة، ويصل تنبيه لصاحب الحساب."],
  },
  "Attack 10: new device": {
    en: ["Attack 10. This is the main reason for MADD.", "The thief knows the email, the password and the PIN. He logs in on his own phone.", "But his phone is not trusted. So rule R3 stops the transfer. No money moves.", "The owner's phone gets an alert. One tap on 'No' freezes the account."],
    ar: ["الهجوم 10: هذا هو السبب الأساسي لـ MADD.", "اللص يعرف البريد وكلمة المرور والرقم السري، ويدخل من جواله.", "لكن جواله غير موثوق، فالقاعدة R3 توقف التحويل، ولا يتحرك أي مال.", "جوال صاحب الحساب يصله تنبيه، وضغطة على «لا» تجمّد الحساب."],
  },
  "Attack 11: log tampering": {
    en: ["Attack 11. Someone goes straight into the database and tries to change or delete the security log.", "A rule inside the database refuses it. The log can only grow.", "So nobody can hide what happened, not even an admin."],
    ar: ["الهجوم 11: شخص يدخل مباشرة إلى قاعدة البيانات ويحاول تعديل سجل الأمان أو حذفه.", "قاعدة داخل قاعدة البيانات ترفض ذلك، والسجل يكبر فقط.", "فلا أحد يستطيع إخفاء ما حدث، ولا حتى المشرف."],
  },
  "All attacks summary": {
    en: ["Here are all 11 attacks. All 11 were stopped.", "No money moved, and no secret was shown.", "If you want, I can run the attack script now. It takes about 30 seconds."],
    ar: ["هذه كل الهجمات الـ 11، وكلها أُوقفت.", "لم يتحرك أي مال، ولم يُكشف أي سر.", "إذا أردتم، أستطيع تشغيل سكربت الهجمات الآن، ويستغرق حوالي 30 ثانية."],
  },
  "Automated tests": {
    en: ["I wrote 279 automatic tests. All 279 pass.", "Each bar is one requirement. Orange is the security rules.", "Each rule is tested exactly on its limit. RM 500.00 does not fire. RM 500.01 does."],
    ar: ["كتبتُ 279 اختبارًا تلقائيًا، وكلها ناجحة.", "كل عمود هو متطلب واحد، والبرتقالي هو قواعد الأمان.", "كل قاعدة مختبرة عند حدها بالضبط: 500.00 رنجت لا تُطلق القاعدة، و 500.01 تُطلقها."],
  },
  "Performance": {
    en: ["I measured the speed.", "A rule check takes less than 0.01 milliseconds. A full server decision takes about 189 milliseconds.", "So the checks do not slow the user down.", "My report did not give a number, so these targets are my own."],
    ar: ["قستُ السرعة.", "فحص القاعدة يأخذ أقل من 0.01 مللي ثانية، وقرار الخادم كاملًا حوالي 189 مللي ثانية.", "إذن الفحوصات لا تُبطئ المستخدم.", "تقريري لم يحدد رقمًا، لذلك هذه الأهداف من وضعي."],
  },
  "Screen check (optional)": {
    en: ["I checked all 48 designed screens against the real app.", "34 matched the first time. 7 admin screens became a website. 7 had small problems, and I fixed all of them."],
    ar: ["قارنتُ كل الشاشات المصمّمة الـ 48 مع التطبيق الحقيقي.", "34 تطابقت من أول مرة، و7 شاشات للمشرف أصبحت موقعًا، و7 فيها مشاكل صغيرة وأصلحتها كلها."],
  },
  "User acceptance testing": {
    en: ["This slide is for the user testing results. I will add them after the testing."],
    ar: ["هذه الشريحة لنتائج اختبار المستخدمين، وسأضيفها بعد الاختبار."],
  },
  "Live demo": {
    en: ["Before: start the server, connect the phone, log in to the demo account and to the admin website.",
      "Step 1: show home and the balance.", "Step 2: send RM 20. It goes straight away. Say: no rule fired.",
      "Step 3: send RM 800. R1 stops it. Show why. Tap yes, type the PIN. The money goes.",
      "Step 4: make another stopped transfer. Tap no. The account freezes.",
      "Step 5: open the admin website. Show the event and the numbers. Unfreeze with a reason.",
      "If something breaks: say 'I will show it from the slides', and go to slides 22, 23, 29 and 30."],
    ar: ["قبل العرض: شغّل الخادم، وصِل الجوال، وادخل إلى الحساب التجريبي وإلى موقع المشرف.",
      "الخطوة 1: اعرض الشاشة الرئيسية والرصيد.", "الخطوة 2: أرسل 20 رنجت، يُرسَل فورًا. قل: لم تنطبق أي قاعدة.",
      "الخطوة 3: أرسل 800 رنجت، القاعدة R1 توقفه. اعرض السبب، اضغط نعم، واكتب الرقم السري. يُرسَل المال.",
      "الخطوة 4: اصنع تحويلًا موقوفًا آخر، واضغط لا. يتجمّد الحساب.",
      "الخطوة 5: افتح موقع المشرف، اعرض الحدث والأرقام، ثم فُكّ التجميد مع كتابة السبب.",
      "إذا تعطّل شيء: قل «سأعرضه من الشرائح»، واذهب إلى الشرائح 22 و23 و29 و30."],
  },
  "Objectives achieved": {
    en: ["Back to my four objectives.", "One, study: done. Two, design: done. Three, build: done. You saw it working.", "Four, test: partly done. All tests pass. User testing is the last step."],
    ar: ["نعود إلى أهدافي الأربعة.", "الأول، الدراسة: تم. الثاني، التصميم: تم. الثالث، البناء: تم، ورأيتموه يعمل.", "الرابع، الاختبار: تم جزئيًا. كل الاختبارات ناجحة، واختبار المستخدمين هو الخطوة الأخيرة."],
  },
  "Limitations": {
    en: ["MADD is not perfect. I want to say this myself.", "It is not online yet, so there is no HTTPS yet.", "The limits are the same for everyone. The rules cannot learn new tricks like AI.", "There is no fingerprint login, and it uses test money, not a real bank."],
    ar: ["MADD ليس كاملًا، وأريد أن أقول ذلك بنفسي.", "ليس على الإنترنت بعد، لذلك لا يوجد HTTPS حتى الآن.", "الحدود نفسها لكل المستخدمين، والقواعد لا تتعلم حيلًا جديدة مثل الذكاء الاصطناعي.", "لا يوجد دخول بالبصمة، ويستخدم مالًا تجريبيًا وليس بنكًا حقيقيًا."],
  },
  "Future work": {
    en: ["Next: put MADD online with HTTPS, and test it with real users.", "Add a new rule for unknown receivers. 58.1 percent in my survey wanted it.", "Later: limits for each user, AI next to the rules, and fingerprint login."],
    ar: ["الخطوة القادمة: رفع MADD على الإنترنت مع HTTPS، واختباره مع مستخدمين حقيقيين.", "إضافة قاعدة جديدة للمستلم غير المعروف، و58.1٪ في استبياني أرادوها.", "لاحقًا: حدود خاصة بكل مستخدم، وذكاء اصطناعي بجانب القواعد، ودخول بالبصمة."],
  },
  "Thank you": {
    en: ["To finish: MADD keeps checking after login. It stops strange transfers, says why, and lets the owner decide.", "Thank you for listening. I am happy to answer your questions."],
    ar: ["في الختام: MADD يستمر في الفحص بعد الدخول، يوقف التحويلات الغريبة، ويشرح السبب، ويترك القرار لصاحب الحساب.", "شكرًا لاستماعكم، ويسعدني الإجابة على أسئلتكم."],
  },
});
