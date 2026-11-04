import {r as React} from './vendor-Iq1R9A-R.js';

// Drafts stay on this browser tab. No analytics, network or account sync.
// The caller keys the component and the draft by account + calendar day.
export const DRAFT_PREFIX = 'formai.mealDraft.v1:';
export const DRAFT_TTL = 24 * 60 * 60 * 1000;

export function readMealDraft(key, storage, now = Date.now()) {
  if (!key) return '';
  try {
    const target = storage ?? globalThis.sessionStorage;
    const item = JSON.parse(target.getItem(DRAFT_PREFIX + key) || 'null');
    if (!item) return '';
    if (typeof item.text !== 'string' || !Number.isFinite(item.at) ||
        now - item.at >= DRAFT_TTL || item.at > now + 60000) {
      target.removeItem(DRAFT_PREFIX + key);
      return '';
    }
    return item.text;
  } catch {
    return '';
  }
}

export function writeMealDraft(key, text, storage, now = Date.now()) {
  if (!key) return;
  try {
    const target = storage ?? globalThis.sessionStorage;
    if (!text.trim()) target.removeItem(DRAFT_PREFIX + key);
    else target.setItem(DRAFT_PREFIX + key, JSON.stringify({text, at: now}));
  } catch {
    // Full/disabled storage must never prevent editing or saving a meal.
  }
}

export function useMealDraft({key, initial = '', clearKey = 0}) {
  const [value, setValue] = React.useState(() => initial || readMealDraft(key));
  const current = React.useRef(value);
  const previousClear = React.useRef(clearKey);
  const update = React.useCallback(next => {
    const text = typeof next === 'function' ? next(current.current) : next;
    current.current = text;
    // Persist synchronously: a tab switch immediately after typing is safe.
    writeMealDraft(key, text);
    setValue(text);
  }, [key]);

  React.useEffect(() => {
    if (initial) update(initial);
  }, [initial, update]);
  React.useEffect(() => {
    if (previousClear.current !== clearKey) {
      previousClear.current = clearKey;
      update('');
    }
  }, [clearKey, update]);
  return [value, update];
}
