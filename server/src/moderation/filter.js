/** Server-side content filter — keep in sync with mobile/src/moderation/filter.ts */

const BANNED_TERMS = [
  // Hebrew — violence, hate, sexual explicit (partial list)
  'אני אהרוג', 'אני אהרוג אותך', 'אני אהרוג אותך', 'תמות', 'תמותי', 'אנס', 'אונס', 'אני אנס',
  'זין', 'כוס', 'שרמוט', 'מניאק', 'בן זונה', 'הomo', 'נאצ', 'טרור', 'פיגוע', 'להתאבד',
  'תתאבד', 'תהרוג את עצמ', 'דוקס', 'כתובת של', 'מספר טלפון של',
  // English
  'kill you', 'kys', 'kill yourself', 'rape', 'nigger', 'faggot', 'bomb threat', 'terrorist attack',
  'send nudes', 'child porn', 'cp ', 'doxx', 'dox ',
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+972|0)[\s-]?(?:5[0-9]|[2-9])\d{1}[\s-]?\d{3}[\s-]?\d{4,5}|\b\d{3}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/;
const URL_RE = /https?:\/\/[^\s]+|www\.[^\s]+/i;
const USERNAME_RE = /@[a-zA-Z0-9_]{2,}/;

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @returns {{ ok: true } | { ok: false, code: string, message: string, severity?: 'severe' }}
 */
export function filterSecretContent(text) {
  if (!text || typeof text !== 'string') {
    return { ok: false, code: 'empty', message: 'empty_content' };
  }

  const raw = text.trim();
  if (EMAIL_RE.test(raw)) {
    return {
      ok: false,
      code: 'pii_email',
      message: 'אין לכלול כתובת אימייל בסוד.',
    };
  }
  if (PHONE_RE.test(raw)) {
    return {
      ok: false,
      code: 'pii_phone',
      message: 'אין לכלול מספר טלפון בסוד.',
    };
  }
  if (URL_RE.test(raw)) {
    return {
      ok: false,
      code: 'pii_url',
      message: 'אין לכלול קישורים בסוד.',
    };
  }
  if (USERNAME_RE.test(raw)) {
    return {
      ok: false,
      code: 'pii_username',
      message: 'אין לכלול @username בסוד.',
    };
  }

  const norm = normalize(raw);
  for (const term of BANNED_TERMS) {
    if (norm.includes(normalize(term))) {
      return {
        ok: false,
        code: 'banned_term',
        message: 'הטקסט מכיל תוכן שאינו מותר לפי כללי הקהילה.',
        severity: 'severe',
      };
    }
  }

  return { ok: true };
}
