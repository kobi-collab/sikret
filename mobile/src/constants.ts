export const INTENTIONS = [
  { id: 'confess', label: 'מתוודה', icon: '◆' },
  { id: 'listen', label: 'מחפש להאזין', icon: '◇' },
  { id: 'small', label: 'סוד קטן', icon: '○' },
  { id: 'unsent', label: 'מכתב שלא נשלח', icon: '△' },
] as const;

export const MIN_CHARS = 25;
export const MAX_CHARS = 1500;

export type OpenMode = 'together' | 'when_peer';
