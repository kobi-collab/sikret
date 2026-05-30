/** EULA / Community Rules — visible in-app for App Store Guideline 1.2 */

export const SUPPORT_EMAIL = 'office@tgbc.co.il';

export const EULA_SECTIONS = [
  {
    title: 'גיל ושימוש',
    body: 'סיקרט מיועדת למשתמשים מגיל 18 ומעלה. השימוש מהווה הסכמה לכללי הקהילה ולתנאים אלה.',
  },
  {
    title: 'אפס סובלנות',
    body: 'לא נסבול תוכן פוגעני או משתמשים abusive. הפרה עלולה להוביל להסרת תוכן, השעיה או חסימה מיידית.',
  },
  {
    title: 'תוכן אסור',
    body: 'אסור לשלוח: הטרדה, איומים, שנאה, תוכן מיני מפורש, תוכן בלתי חוקי, פרטים מזהים (שם, טלפון, אימייל, @username), doxxing, בריונות, תוכן מוגן בזכויות יוצרים, עידוד לפגיעה עצמית, או spam.',
  },
  {
    title: 'מודרציה',
    body: 'תוכן מסונן לפני שליחה. ניתן לדווח על סוד שקיבלת — הוא יוסר מהמסך מיד. דיווחים נבדקים תוך 24 שעות. משתמשים מדווחים עלולים להיות מושעים או חסומים.',
  },
  {
    title: 'יצירת קשר',
    body: `לדיווח על שימוש לרעה או תמיכה: ${SUPPORT_EMAIL}`,
  },
];

export const EULA_FULL_TEXT = EULA_SECTIONS.map((s) => `${s.title}\n${s.body}`).join('\n\n');
