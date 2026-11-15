import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThreeUnavailablePanel } from './ThreeUnavailablePanel';

test('inline panel says the 3D view is unavailable and the rest of the page works', () => {
  const html = renderToStaticMarkup(createElement(ThreeUnavailablePanel, {}));
  assert.match(html, /3D view unavailable/);
  assert.match(html, /Everything else on this page works as normal/);
  assert.match(html, /data-testid="three-unavailable-panel"/);
  assert.match(html, /data-variant="inline"/);
});

test('background panel keeps a small note and fills its container', () => {
  const html = renderToStaticMarkup(
    createElement(ThreeUnavailablePanel, { variant: 'background' })
  );
  assert.match(html, /3D view unavailable/);
  assert.match(html, /data-variant="background"/);
  assert.match(html, /absolute inset-0/);
});

test('panel uses semantic theme classes only (no hard-coded hex colours)', () => {
  const html =
    renderToStaticMarkup(createElement(ThreeUnavailablePanel, {})) +
    renderToStaticMarkup(createElement(ThreeUnavailablePanel, { variant: 'background' }));
  assert.doesNotMatch(html, /#[0-9a-f]{3,8}\b/i);
});
