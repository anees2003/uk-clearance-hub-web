import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isStudioLoadSettled,
  isStudioFailed,
  markStudioFailed,
  subscribeStudioFailure,
  STUDIO_PRELOADER_MAX_WAIT_MS,
} from './studioProgressStore';

const loading = { active: true, progress: 40, loaded: 2, total: 5, item: 'bed.glb' };
const finished = { active: false, progress: 100, loaded: 5, total: 5, item: '' };
const notStarted = { active: false, progress: 0, loaded: 0, total: 0, item: '' };

test('isStudioLoadSettled is false while the 3D model is still loading', () => {
  assert.equal(isStudioLoadSettled(loading, { failed: false, maxWaitPassed: false }), false);
  assert.equal(isStudioLoadSettled(notStarted, { failed: false, maxWaitPassed: false }), false);
});

test('isStudioLoadSettled is true once loading has finished', () => {
  assert.equal(isStudioLoadSettled(finished, { failed: false, maxWaitPassed: false }), true);
  assert.equal(
    isStudioLoadSettled({ ...finished, progress: 80 }, { failed: false, maxWaitPassed: false }),
    true,
    'all items done counts as finished even if progress rounding is short of 100'
  );
});

test('isStudioLoadSettled is true as soon as the 3D layer has failed', () => {
  assert.equal(isStudioLoadSettled(loading, { failed: true, maxWaitPassed: false }), true);
  assert.equal(isStudioLoadSettled(notStarted, { failed: true, maxWaitPassed: false }), true);
});

test('isStudioLoadSettled gives up after the maximum wait, even while still loading', () => {
  assert.equal(isStudioLoadSettled(loading, { failed: false, maxWaitPassed: true }), true);
  assert.ok(STUDIO_PRELOADER_MAX_WAIT_MS >= 8000 && STUDIO_PRELOADER_MAX_WAIT_MS <= 12000);
});

test('markStudioFailed sets the shared flag once and notifies listeners', () => {
  const calls: boolean[] = [];
  const unsubscribe = subscribeStudioFailure((failed) => calls.push(failed));
  assert.equal(isStudioFailed(), false);
  markStudioFailed();
  markStudioFailed();
  assert.equal(isStudioFailed(), true);
  assert.deepEqual(calls, [true], 'listeners are notified once, not on repeat calls');
  unsubscribe();
});
