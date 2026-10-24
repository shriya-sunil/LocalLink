import { strict as assert } from 'node:assert';
import test from 'node:test';

import { processPayment } from '../src/lib/api/bookings.ts';
import { setDevDemoMode } from '../src/lib/api/supabaseClient.ts';
import { MOCK_BOOKINGS } from '../src/lib/mockData.ts';

function installLocalStorage() {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  } as Storage;
}

test('cash payment finalizes the booking and records completion flags', async () => {
  installLocalStorage();
  setDevDemoMode(true);

  const original = MOCK_BOOKINGS.map((booking) =>
    booking.id === 'bk_301'
      ? { ...booking, status: 'in_progress', paymentStatus: 'pending', providerMarkedComplete: false, customerConfirmedCompletion: false }
      : booking,
  );

  globalThis.localStorage.setItem('locallink_bookings_cache', JSON.stringify(original));

  const result = await processPayment('bk_301', 'cash');

  assert.equal(result.success, true);
  assert.equal(result.message, 'Cash settlement recorded.');

  const normalized = JSON.parse(globalThis.localStorage.getItem('locallink_bookings_cache') || '[]');
  const updated = normalized.find((booking: any) => booking.id === 'bk_301');

  assert.ok(updated, 'booking should exist');
  assert.equal(updated.status, 'completed');
  assert.equal(updated.paymentStatus, 'completed');
  assert.equal(updated.paymentMethod, 'cash');
  assert.equal(updated.providerMarkedComplete, true);
  assert.equal(updated.customerConfirmedCompletion, true);
});
