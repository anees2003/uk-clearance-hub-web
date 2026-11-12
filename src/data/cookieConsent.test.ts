import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COOKIE_CATEGORY_DEFINITIONS,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  createConsentRecord,
  getStoredConsentRecord,
  hasConsent,
  parseConsentRecord,
  saveConsentRecord,
} from './cookieConsent';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    clear(): void {
      store.clear();
    },
  };
}

test('COOKIE_CATEGORY_DEFINITIONS defines necessary, analytics, and marketing categories', () => {
  assert.equal(COOKIE_CATEGORY_DEFINITIONS.length, 3);
  assert.equal(COOKIE_CATEGORY_DEFINITIONS[0].id, 'necessary');
  assert.equal(COOKIE_CATEGORY_DEFINITIONS[0].alwaysActive, true);
  assert.equal(COOKIE_CATEGORY_DEFINITIONS[1].id, 'analytics');
  assert.equal(COOKIE_CATEGORY_DEFINITIONS[1].alwaysActive, false);
  assert.equal(COOKIE_CATEGORY_DEFINITIONS[2].id, 'marketing');
  assert.equal(COOKIE_CATEGORY_DEFINITIONS[2].alwaysActive, false);
});

test('createConsentRecord and parseConsentRecord round-trip with version and ISO date', () => {
  const fixedDate = new Date('2026-11-12T12:00:00.000Z');
  const record = createConsentRecord(
    { analytics: true, marketing: false },
    fixedDate
  );

  assert.equal(record.version, COOKIE_CONSENT_VERSION);
  assert.equal(record.updatedAt, '2026-11-12T12:00:00.000Z');
  assert.deepEqual(record.categories, {
    necessary: true,
    analytics: true,
    marketing: false,
  });

  const parsed = parseConsentRecord(JSON.stringify(record));
  assert.deepEqual(parsed, record);
});

test('parseConsentRecord rejects outdated versions or malformed JSON', () => {
  assert.equal(parseConsentRecord(null), null);
  assert.equal(parseConsentRecord('not-json'), null);
  assert.equal(
    parseConsentRecord(
      JSON.stringify({
        version: COOKIE_CONSENT_VERSION - 1,
        updatedAt: '2026-11-12T12:00:00.000Z',
        categories: { necessary: true, analytics: true, marketing: true },
      })
    ),
    null
  );
});

test('hasConsent returns false for analytics/marketing before consent and true after opt-in', () => {
  const storage = createMemoryStorage();

  // Before any choice is saved
  assert.equal(getStoredConsentRecord(storage), null);
  assert.equal(hasConsent('necessary', storage), true);
  assert.equal(hasConsent('analytics', storage), false);
  assert.equal(hasConsent('marketing', storage), false);

  // Reject non-essential
  saveConsentRecord({ analytics: false, marketing: false }, storage);
  assert.ok(storage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  assert.equal(hasConsent('necessary', storage), true);
  assert.equal(hasConsent('analytics', storage), false);
  assert.equal(hasConsent('marketing', storage), false);

  // Enable analytics only
  saveConsentRecord({ analytics: true, marketing: false }, storage);
  assert.equal(hasConsent('analytics', storage), true);
  assert.equal(hasConsent('marketing', storage), false);

  // Accept all
  saveConsentRecord({ analytics: true, marketing: true }, storage);
  assert.equal(hasConsent('analytics', storage), true);
  assert.equal(hasConsent('marketing', storage), true);
});
