export const copy = {
  appName: 'סיקרט',
  tagline: 'חיים בלי סודות.',

  resonanceYours: 'התהודה שלך',
  resonancePeer: 'תהודת הזר',
  resonance: 'תהודה',

  secretsToday: 'סודות היום',
  secretsLeft: (n: number) => `נשארו ${n} סודות`,

  homeHint:
    'מתוודים על סוד, מקבלים סוד זר בתמורה. הסוד נשלח רק כשיש סוד בתמורה. טקסט בלבד.',
  newSecret: 'סוד חדש',
  continueSecret: 'המשך סוד פעיל',
  howItWorks: 'איך זה עובד?',

  intentionTitle: 'מה תרצה לשתף?',
  intentionHint: 'כיוון בלבד — לא התוכן. עוזר להתאים סוד לזר.',

  composeTitle: 'הסוד שלך',
  composeHint:
    'הזר יראה רק את הטקסט. אל תכלול שם, טלפון או @username. מינימום 100 תווים.',
  composePlaceholder: 'כתוב כאן מה שאתה רוצה לוודות...',

  sendTitle: 'שליחת הסוד',
  sendHint:
    'הסוד נשאר אצלך עד שיימצא סוד זר בתמורה. אז תקבל גם את הסוד שלו — ואז תוכלו לקרוא.',
  sendWarn: 'אחרי השליחה אין עריכה וביטול. אל תכלול פרטים מזהים.',
  sendCta: 'שלח וחפש סוד זר',

  queueTitle: 'מחפשים סוד בתמורה...',
  queueHint:
    'הסוד שלך בדרך. ברגע שיימצא זר עם אותו כיוון — תקבלו סוד זר. בטא: סוד אנונימי תוך ~8 שניות.',
  queueJoining: 'שולח לתור...',
  queueWaiting: 'מחפש סוד זר...',
  leaveQueue: 'יציאה מהתור',

  swapLoading: 'טוען סוד...',
  swapPreparing: 'מכינים את הקבלה...',
  swapFrom: (alias: string) => `סוד מ${alias}`,
  swapYourSecretFeedback: (label: string) =>
    label ? `מי שקרא את הסוד שלך — ${label}` : 'מי שקרא את הסוד שלך — עדיין לא הגיב',
  swapRateQuestion: 'איך הסוד שקראת?',
  finishNoRate: 'סיום בלי דירוג',

  revealTitle: 'משהו נחזר אליך',
  revealResonance: (v: number, delta: string) => `התהודה שלך: ${v.toFixed(1)} (${delta})`,
  revealWaiting: 'מי שקרא את הסוד שלך — עדיין לא הגיב.',
  revealPeer: (v: number) => `תהודת הזר כעת: ${v.toFixed(1)}`,
  revealContinue: 'ממשיך',

  feedbackTouched: 'נגע בי',
  feedbackDishonest: 'לא כנה',
  feedbackReport: 'דיווח',
};
