import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ErrorBoundary,
  ErrorFallback,
  classifyBoundaryError,
  shouldResetBoundary,
} from './ErrorBoundary';

test('classifyBoundaryError detects page code that failed to load (all major browsers)', () => {
  const chunkMessages = [
    // Chrome / Edge
    'Failed to fetch dynamically imported module: https://ukclearancehub.co.uk/assets/FaqPage-abc123.js',
    // Firefox
    'error loading dynamically imported module: https://ukclearancehub.co.uk/assets/FaqPage-abc123.js',
    // Safari
    'Importing a module script failed.',
    // Vite preload helper
    'Unable to preload CSS for /assets/FaqPage-abc123.css',
  ];
  for (const message of chunkMessages) {
    assert.equal(classifyBoundaryError(new TypeError(message)), 'needs-refresh', message);
  }
  const chunkError = new Error('Loading chunk 7 failed.');
  chunkError.name = 'ChunkLoadError';
  assert.equal(classifyBoundaryError(chunkError), 'needs-refresh');
});

test('classifyBoundaryError treats every other error as general', () => {
  assert.equal(classifyBoundaryError(new Error('Could not load bed.glb: Failed to fetch')), 'general');
  assert.equal(classifyBoundaryError(new TypeError('Cannot read properties of undefined')), 'general');
  assert.equal(classifyBoundaryError('a thrown string'), 'general');
  assert.equal(classifyBoundaryError(undefined), 'general');
  assert.equal(classifyBoundaryError({ message: 42 }), 'general');
});

test('getDerivedStateFromError records the error and its kind', () => {
  const error = new TypeError('Failed to fetch dynamically imported module: /assets/x.js');
  assert.deepEqual(ErrorBoundary.getDerivedStateFromError(error), {
    error,
    kind: 'needs-refresh',
  });
  const general = new Error('boom');
  assert.deepEqual(ErrorBoundary.getDerivedStateFromError(general), {
    error: general,
    kind: 'general',
  });
});

test('shouldResetBoundary resets only when there is an error and the reset key changed', () => {
  assert.equal(shouldResetBoundary(true, '/about', '/faq'), true);
  assert.equal(shouldResetBoundary(true, '/about', '/about'), false);
  assert.equal(shouldResetBoundary(false, '/about', '/faq'), false);
  assert.equal(shouldResetBoundary(true, undefined, undefined), false);
});

test('componentDidCatch passes the caught error to the onError callback', () => {
  const caught: unknown[] = [];
  const boundary = new ErrorBoundary({ onError: (error: unknown) => caught.push(error) });
  const error = new Error('Could not load bed.glb');
  boundary.componentDidCatch(error);
  assert.deepEqual(caught, [error]);
  // Without a callback it must not throw.
  new ErrorBoundary({}).componentDidCatch(error);
});

test('ErrorFallback (general) offers Try again, Home, WhatsApp and Email in plain English', () => {
  const html = renderToStaticMarkup(
    createElement(ErrorFallback, { kind: 'general', onRetry: () => {} })
  );
  assert.match(html, /Sorry, this page didn(’|'|&#x27;)t load/);
  assert.match(html, /Try again/);
  assert.match(html, /href="\/"/);
  assert.match(html, /href="https:\/\/wa\.me\/447344540043/);
  assert.match(html, /href="mailto:admin@ukclearancehub\.co\.uk"/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /UKCH-P-|SUP-\d/);
});

test('ErrorFallback (needs-refresh) asks for a refresh with a Reload button', () => {
  const html = renderToStaticMarkup(
    createElement(ErrorFallback, { kind: 'needs-refresh', onRetry: () => {} })
  );
  assert.match(html, /This page needs a refresh/);
  assert.match(html, /Reload/);
  assert.doesNotMatch(html, /Sorry, this page didn/);
});
