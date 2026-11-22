/* Speaker notes, slides 1–27: simple English, then Arabic. Keyed by each slide's aria-label. deck.js shows them with N. */
const NOTES = {};

Object.assign(NOTES, {
  "Title": {
    en: ["Good morning. My name is Zakarya Dawman. My student number is TP079346.", "My supervisor is Ts. Umapathy. My second marker is Dr. Shabbir.", "My project is MADD. It is a safe e-wallet. It checks every money transfer, even after you log in."],
    ar: ["صباح الخير. اسمي زكريا دومان، ورقمي الجامعي TP079346.", "مشرفي هو Ts. أوماباثي، والمُقيّم الثاني هو د. شبير.", "مشروعي اسمه MADD (مدّ). هو محفظة إلكترونية آمنة، تفحص كل تحويل مالي حتى بعد تسجيل الدخول."],
  },
  "Why I built MADD": {
    en: ["I am from Yemen. In Yemen, we always think about keeping our money safe.", "In Malaysia, paying is very easy. One tap, and the money is sent.", "But one tap is also easy for a thief. Security is very important to me.", "So I made a wallet that asks me before any strange transfer goes out.", "The name: in Arabic, the madda makes a sound longer. MADD makes protection longer, after login too."],
    ar: ["أنا من اليمن. في اليمن نفكّر دائمًا في حماية أموالنا.", "في ماليزيا الدفع سهل جدًا، ضغطة واحدة ويُرسَل المال.", "لكن الضغطة الواحدة سهلة أيضًا على اللص. الأمان مهم جدًا بالنسبة لي.", "لذلك صنعتُ محفظة تسألني قبل أن يخرج أي تحويل غريب.", "معنى الاسم: علامة المدّ في العربية تُطيل الصوت، و MADD تُطيل الحماية إلى ما بعد تسجيل الدخول."],
  },
  "Agenda": {
    en: ["This is my plan for today.", "First the problem. Then my aim and my research. Then how I designed it.", "The main part is the app itself. I will show you the real screens.", "Then the admin website, security, tests, a live demo, and my conclusion."],
    ar: ["هذه خطة العرض اليوم.", "أولًا المشكلة، ثم الهدف والبحث، ثم طريقة التصميم.", "الجزء الأهم هو التطبيق نفسه، وسأعرض الشاشات الحقيقية.", "بعدها موقع المشرف، والأمان، والاختبارات، وعرض مباشر، ثم الخاتمة."],
  },
  "E-wallet fraud is growing": {
    en: ["Many people now use e-wallets. Fraud is growing too.", "Reports say payment fraud grew by 25 percent from 2020 to 2023.", "When money is stolen from an e-wallet, it is very hard to get it back."],
    ar: ["كثير من الناس يستخدمون المحافظ الإلكترونية الآن، والاحتيال يزداد أيضًا.", "التقارير تقول إن احتيال الدفع زاد بنسبة 25٪ من 2020 إلى 2023.", "عندما يُسرق المال من محفظة إلكترونية، يكون استرجاعه صعبًا جدًا."],
  },
  "Account takeover after login": {
    en: ["Thieves often steal the password. They trick the user, for example with a fake message.", "Fingerprint and face can also be tricked.", "The big problem: all of these only check you once, at login. After login, nobody checks the transfers."],
    ar: ["اللصوص غالبًا يسرقون كلمة المرور، يخدعون المستخدم مثلًا برسالة مزيّفة.", "البصمة والوجه يمكن خداعهما أيضًا.", "المشكلة الكبرى: كل هذه الطرق تفحصك مرة واحدة فقط عند الدخول. بعد الدخول لا أحد يفحص التحويلات."],
  },
  "The gap MADD fills": {
    en: ["Experts say checking must continue after login.", "But many e-wallets only check at the door.", "MADD checks every transfer. If something looks strange, it stops it and asks the owner."],
    ar: ["الخبراء يقولون إن الفحص يجب أن يستمر بعد الدخول.", "لكن كثيرًا من المحافظ تفحص عند الباب فقط.", "MADD يفحص كل تحويل، وإذا بدا شيء غريبًا يوقفه ويسأل صاحب الحساب."],
  },
  "Project aim": {
    en: ["This is my aim: to build a safe mobile e-wallet that finds strange transfers in real time.", "Real time means: during the transfer, not later."],
    ar: ["هذا هو هدفي: بناء محفظة جوال آمنة تكتشف التحويلات المشبوهة في الوقت الحقيقي.", "الوقت الحقيقي يعني: أثناء التحويل، وليس بعده."],
  },
  "Four objectives": {
    en: ["I had four objectives.", "One: study how e-wallets protect users today. Two: design the system.", "Three: build the app. Four: test it.", "At the end, I will show that I reached each one."],
    ar: ["كان عندي أربعة أهداف فرعية.", "الأول: دراسة كيف تحمي المحافظ المستخدمين اليوم. الثاني: تصميم النظام.", "الثالث: بناء التطبيق. الرابع: اختباره.", "في النهاية سأوضح أنني حققتُ كل واحد منها."],
  },
  "Similar systems compared": {
    en: ["I studied three e-wallets in Malaysia: Touch 'n Go, GrabPay and MAE.", "They protect the login well, with a PIN and the phone.", "But they do not say how they check each transfer.", "MADD uses four clear rules. Each rule is written and tested."],
    ar: ["درستُ ثلاث محافظ في ماليزيا: Touch 'n Go و GrabPay و MAE.", "هي تحمي الدخول جيدًا، بالرقم السري وبالجوال.", "لكنها لا توضّح كيف تفحص كل تحويل.", "MADD يستخدم أربع قواعد واضحة، كل قاعدة مكتوبة ومختبرة."],
  },
  "Survey findings: the problem": {
    en: ["I asked 31 e-wallet users.", "45 percent had money taken, or thought so.", "Only 9.7 percent of them got a warning from their app.", "74.2 percent said checking after login is extremely important."],
    ar: ["سألتُ 31 مستخدمًا للمحافظ الإلكترونية.", "45٪ منهم أُخذ منهم مال، أو ظنّوا ذلك.", "9.7٪ فقط منهم وصلهم تنبيه من التطبيق.", "74.2٪ قالوا إن الفحص بعد الدخول مهم جدًا."],
  },
  "Survey findings: the design": {
    en: ["I asked: what should the app do with a strange transfer?", "Most people, 83.9 percent, said: ask me first.", "Fewer people wanted the app to block it alone.", "So MADD stops the transfer and asks the owner."],
    ar: ["سألتُ: ماذا يفعل التطبيق مع تحويل غريب؟", "أغلب الناس، 83.9٪، قالوا: اسألني أولًا.", "عدد أقل أراد أن يحظره التطبيق وحده.", "لذلك MADD يوقف التحويل ويسأل صاحب الحساب."],
  },
  "Incremental development": {
    en: ["I built the project in four steps.", "Step one: the basic wallet. Step two: login and phones. Step three: the four rules and alerts. Step four: the admin website.", "I tested each step before I started the next one."],
    ar: ["بنيتُ المشروع على أربع مراحل.", "الأولى: المحفظة الأساسية. الثانية: الدخول والأجهزة. الثالثة: القواعد الأربع والتنبيهات. الرابعة: موقع المشرف.", "كنتُ أختبر كل مرحلة قبل أن أبدأ التي بعدها."],
  },
  "System architecture": {
    en: ["This is how the parts connect.", "On the left: the phone app and the admin website.", "In the middle: the server. The server makes every decision. The app only shows the result.", "On the right: the database, and Firebase, which sends alerts to the owner's phones."],
    ar: ["هكذا تتصل أجزاء النظام.", "على اليسار: تطبيق الجوال وموقع المشرف.", "في الوسط: الخادم. الخادم يتخذ كل القرارات، والتطبيق يعرض النتيجة فقط.", "على اليمين: قاعدة البيانات، و Firebase الذي يرسل التنبيهات إلى جوالات صاحب الحساب."],
  },
  "The four detection rules": {
    en: ["These are the four rules.", "R1: the amount is too big. More than RM 500, and more than 3 times your usual amount.", "R2: too many transfers. More than 3 in 5 minutes.", "R3: a new phone that is not trusted. R4: 5 wrong passwords in 15 minutes."],
    ar: ["هذه هي القواعد الأربع.", "R1: المبلغ كبير جدًا، أكثر من 500 رنجت وأكثر من 3 أضعاف مبلغك المعتاد.", "R2: تحويلات كثيرة جدًا، أكثر من 3 في 5 دقائق.", "R3: جوال جديد غير موثوق. R4: 5 كلمات مرور خاطئة في 15 دقيقة."],
  },
  "Database tables": {
    en: ["The database has ten tables.", "Money is saved as whole numbers, so there are no rounding mistakes.", "The security log can never be changed or deleted."],
    ar: ["قاعدة البيانات فيها عشرة جداول.", "المال يُحفظ كأرقام صحيحة، فلا توجد أخطاء تقريب.", "سجل الأمان لا يمكن تعديله أو حذفه أبدًا."],
  },
  "All customer screens": {
    en: ["The app has 41 screens for customers.", "Here they are in four groups: get in, move money, stay safe, and manage the account.", "Now I will show the most important ones."],
    ar: ["التطبيق فيه 41 شاشة للعملاء.", "هنا مقسّمة إلى أربع مجموعات: الدخول، تحويل المال، الأمان، وإدارة الحساب.", "الآن سأعرض أهمها."],
  },
  "Getting in flow": {
    en: ["To join, the user makes an account, then a 6-digit PIN.", "The account is made only after the PIN.", "The password and PIN are saved in a safe, scrambled form.", "Login opens a session for 30 minutes."],
    ar: ["للتسجيل ينشئ المستخدم حسابًا، ثم رقمًا سريًا من 6 أرقام.", "الحساب لا يُنشأ إلا بعد الرقم السري.", "كلمة المرور والرقم السري يُحفظان بشكل مشفّر وآمن.", "تسجيل الدخول يفتح جلسة لمدة 30 دقيقة."],
  },
  "Screen 05 Home": {
    en: ["This is the home screen.", "Number 1 says protection is on. Number 2 is the balance. It always comes from the server.", "Number 3: send, receive and scan. Number 4: a transfer that is waiting for you. Number 5: recent activity."],
    ar: ["هذه هي الشاشة الرئيسية.", "رقم 1 يقول إن الحماية مفعّلة. رقم 2 هو الرصيد، ويأتي دائمًا من الخادم.", "رقم 3: إرسال واستلام ومسح. رقم 4: تحويل ينتظر قرارك. رقم 5: آخر العمليات."],
  },
  "Sending money flow": {
    en: ["Sending money takes five screens.", "Choose the person, type the amount, check it, and type the PIN.", "Then the server checks everything. If all is fine, the money goes. If a rule fires, the transfer waits."],
    ar: ["إرسال المال يمرّ بخمس شاشات.", "اختر الشخص، اكتب المبلغ، راجع، ثم اكتب الرقم السري.", "بعدها الخادم يفحص كل شيء. إذا كان كل شيء سليمًا يُرسَل المال، وإذا انطبقت قاعدة يتوقف التحويل وينتظر."],
  },
  "Screens 16 and 15 Receive and Scan": {
    en: ["To receive money, you show your QR code. It has only your phone number.", "To pay, you scan a QR code with the camera.", "A scanned payment gets the same checks as any other transfer."],
    ar: ["لاستلام المال تعرض رمز QR الخاص بك، وفيه رقم جوالك فقط.", "للدفع تمسح رمز QR بالكاميرا.", "الدفع بالمسح يمرّ بنفس الفحوصات مثل أي تحويل آخر."],
  },
  "Screen 17 History": {
    en: ["History shows all transfers, by day.", "Number 3 is waiting for you. Number 4 was cancelled. No money moved.", "You can only see your own transfers."],
    ar: ["السجل يعرض كل التحويلات حسب اليوم.", "رقم 3 ينتظر قرارك. رقم 4 أُلغي، ولم يتحرك أي مال.", "لا يمكنك رؤية إلا تحويلاتك أنت."],
  },
  "Screen 11 Held transfer, rules R1 and R2": {
    en: ["When R1 or R2 fires, the user sees this screen.", "No money has moved yet. There is a 5-minute timer.", "Number 3 explains why, in simple words.", "The owner chooses: yes, it was me, or no, freeze my account."],
    ar: ["عندما تنطبق القاعدة R1 أو R2 يرى المستخدم هذه الشاشة.", "لم يتحرك أي مال بعد، وهناك مؤقّت 5 دقائق.", "رقم 3 يشرح السبب بكلمات بسيطة.", "صاحب الحساب يختار: نعم أنا، أو لا، جمّد حسابي."],
  },
  "Yes, No or no answer": {
    en: ["A stopped transfer can end in three ways.", "Yes: the owner types the PIN, and the money goes once.", "No: the account is frozen, and every phone is logged out.", "No answer: after 5 minutes it is cancelled. Money moves only with yes."],
    ar: ["التحويل الموقوف ينتهي بإحدى ثلاث طرق.", "نعم: يكتب صاحب الحساب الرقم السري، ويُرسَل المال مرة واحدة.", "لا: يُجمَّد الحساب، ويُسجَّل الخروج من كل الجوالات.", "بلا رد: بعد 5 دقائق يُلغى. المال لا يتحرك إلا مع نعم."],
  },
  "New device, rule R3": {
    en: ["This is R3, a new phone.", "Someone can log in on a new phone, but they cannot send money yet.", "The owner's usual phone gets an alert. The owner can trust the new phone, or freeze the account.", "The alert goes only to trusted phones, so a thief cannot approve himself."],
    ar: ["هذه القاعدة R3، جوال جديد.", "يمكن لأي شخص الدخول من جوال جديد، لكنه لا يستطيع إرسال المال بعد.", "جوال صاحب الحساب المعتاد يصله تنبيه، فيختار أن يثق بالجوال الجديد أو يجمّد الحساب.", "التنبيه يذهب للجوالات الموثوقة فقط، فاللص لا يستطيع أن يوافق لنفسه."],
  },
  "Screens 27 and 31, rule R4 and the PIN lock": {
    en: ["These two screens stop guessing.", "Left, R4: 5 wrong passwords lock sign-in for 15 minutes.", "Right: 5 wrong PINs lock transfers for 15 minutes.", "The owner gets an alert, and can freeze the account."],
    ar: ["هاتان الشاشتان توقفان التخمين.", "يسارًا، القاعدة R4: 5 كلمات مرور خاطئة تقفل الدخول 15 دقيقة.", "يمينًا: 5 أرقام سرية خاطئة تقفل التحويلات 15 دقيقة.", "صاحب الحساب يصله تنبيه، ويمكنه تجميد الحساب."],
  },
  "Screen 18 Inbox, Security tab": {
    en: ["Every alert is also saved in the inbox.", "So if a phone alert is missed, the owner can still see it here.", "The owner can answer a waiting transfer from here too."],
    ar: ["كل تنبيه يُحفظ أيضًا في صندوق الرسائل.", "فإذا فات تنبيه الجوال، يستطيع صاحب الحساب رؤيته هنا.", "ويمكنه الرد على تحويل منتظر من هنا أيضًا."],
  },
  "Profile and Freeze my account (optional)": {
    en: ["The owner can freeze the account at any time, for example if the phone is lost.", "Every session ends at once.", "Only an admin can unfreeze it, and must write a reason."],
    ar: ["صاحب الحساب يستطيع تجميد حسابه في أي وقت، مثلًا إذا ضاع الجوال.", "كل الجلسات تنتهي فورًا.", "المشرف فقط يستطيع فكّ التجميد، ويجب أن يكتب السبب."],
  },
});
