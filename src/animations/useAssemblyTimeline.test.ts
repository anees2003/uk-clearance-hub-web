import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  ASSEMBLY_CHAPTERS,
  CAMERA_KEYFRAMES,
  COMPLETE_ORBIT_CENTER,
  COMPLETE_ORBIT_RADIUS,
  MOBILE_CAMERA_DISTANCE_MULTIPLIER,
  MAX_DESKTOP_PARALLAX_UNITS,
  computeOrbitCameraPosition,
  computeFinalCameraPosition,
  computeHeadboardHingePose,
  computeBasePivotedLampPose,
  applyInitialDisassembledState,
  syncPartVisibilityForTimelineTime,
} from './useAssemblyTimeline';
import { groupWordsByOffsetTop } from './splitLines';
import {
  CHAPTER_PROGRESS_STOPS,
  computeMonotonicProgress,
  formatPreloaderCounter,
  computeChapterProgressState,
} from '../data/assemblyChapters';
import {
  EXPECTED_BED_NODE_NAMES,
  extractBedPartsAndTransforms,
  BedSetHandle,
} from '../three/bedParts';

function createMockBedSetHandle(): BedSetHandle {
  const nodes: Record<string, THREE.Object3D> = {};
  EXPECTED_BED_NODE_NAMES.forEach((name, idx) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1));
    mesh.name = name;
    mesh.position.set(idx * 0.1, 0.4 + idx * 0.05, -0.4);
    nodes[name] = mesh;
  });

  const extracted = extractBedPartsAndTransforms(nodes);
  const bedGroup = new THREE.Group();
  const lampLightLeft = new THREE.PointLight('#FFD9A0', 1.2, 2.5, 2);
  const lampLightRight = new THREE.PointLight('#FFD9A0', 1.2, 2.5, 2);
  const cameraPosition = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();

  return {
    ...extracted.parts,
    parts: extracted.parts,
    originalTransforms: extracted.originalTransforms,
    bedGroup,
    lampLightLeft,
    lampLightRight,
    cameraPosition,
    cameraTarget,
  };
}

test('ASSEMBLY_CHAPTERS defines the 8 required chapter IDs and alternating panel sides', () => {
  assert.deepEqual(
    ASSEMBLY_CHAPTERS.map((c) => c.id),
    [
      'chapter-hero',
      'chapter-base',
      'chapter-mattress',
      'chapter-headboard',
      'chapter-pillows',
      'chapter-bedside',
      'chapter-lighting',
      'chapter-complete',
    ]
  );

  // Hero has no panel yet (Step 5); chapters 2-8 alternate left, right, left, right, left, right, center
  assert.equal(ASSEMBLY_CHAPTERS[0].panel, undefined);
  assert.deepEqual(
    ASSEMBLY_CHAPTERS.slice(1).map((c) => c.panel?.side),
    ['left', 'right', 'left', 'right', 'left', 'right', 'center']
  );

  // Numbered chapters 01 / 06 through 06 / 06 have 3 spec bullets each
  const numberedChapters = ASSEMBLY_CHAPTERS.slice(1, 7);
  assert.deepEqual(
    numberedChapters.map((c) => c.panel?.chapterNumber),
    ['01 / 06', '02 / 06', '03 / 06', '04 / 06', '05 / 06', '06 / 06']
  );
  numberedChapters.forEach((c) => {
    assert.equal(c.panel?.specs?.length, 3);
  });

  // Complete chapter has required heading and two CTA links
  const completePanel = ASSEMBLY_CHAPTERS[7].panel!;
  assert.equal(
    completePanel.heading,
    'Up to 70% off. Clearance stock, top brands.'
  );
  assert.deepEqual(
    completePanel.ctas?.map((cta) => cta.to),
    ['/clearance-deals', '/bed-size-guide']
  );
});

test('computeHeadboardHingePose hinges around bottom edge and returns exact original pose at angle 0', () => {
  const origPos = new THREE.Vector3(-0.829, 0.4716, -0.427);
  const origRot = new THREE.Euler(0, 0, 0);
  const bottomOffset = 0.4716;

  // At 0 rad -> matches original position and rotation
  const upright = computeHeadboardHingePose(origPos, origRot, bottomOffset, 0);
  assert.ok(Math.abs(upright.x - origPos.x) < 1e-6);
  assert.ok(Math.abs(upright.y - origPos.y) < 1e-6);
  assert.ok(Math.abs(upright.rotZ - 0) < 1e-6);

  // At 90 deg backwards (Math.PI / 2) -> centre Y is at bottom edge (0) and X shifts backwards by bottomOffset
  const flat = computeHeadboardHingePose(origPos, origRot, bottomOffset, Math.PI / 2);
  assert.ok(Math.abs(flat.y - 0) < 1e-6);
  assert.ok(Math.abs(flat.x - (origPos.x - bottomOffset)) < 1e-6);
  assert.ok(Math.abs(flat.rotZ - Math.PI / 2) < 1e-6);
});

test('computeBasePivotedLampPose grows lamp from nightstand top surface', () => {
  const origPos = new THREE.Vector3(-0.44, 0.7325, -1.677);
  const origScale = new THREE.Vector3(1, 1, 1);
  const bottomOffset = 0.3539;

  const startPose = computeBasePivotedLampPose(origPos, origScale, bottomOffset, 0);
  assert.equal(startPose.scaleY, 0);
  assert.ok(Math.abs(startPose.y - (origPos.y - bottomOffset)) < 1e-6);

  const endPose = computeBasePivotedLampPose(origPos, origScale, bottomOffset, 1);
  assert.equal(endPose.scaleY, 1);
  assert.ok(Math.abs(endPose.y - origPos.y) < 1e-6);
});

test('applyInitialDisassembledState and syncPartVisibilityForTimelineTime hide and reveal parts in chapter order', () => {
  const handle = createMockBedSetHandle();
  applyInitialDisassembledState(handle);

  // At hero (t = 0), all 9 parts are hidden, lamp lights have intensity 0, and camera starts at hero keyframe
  syncPartVisibilityForTimelineTime(handle, 0);
  assert.equal(handle.base?.visible, false);
  assert.equal(handle.mattress?.visible, false);
  assert.equal(handle.lampLeft?.visible, false);
  assert.equal(handle.lampLightLeft?.intensity, 0);
  assert.deepEqual(
    handle.cameraPosition.toArray(),
    CAMERA_KEYFRAMES.hero.position.toArray()
  );

  // In chapter-base (t = 0.8), only base is visible
  syncPartVisibilityForTimelineTime(handle, 0.8);
  assert.equal(handle.base?.visible, true);
  assert.equal(handle.mattress?.visible, false);

  // In chapter-pillows between stagger (t = 3.1), pillowsBack is visible, pillowsFront is still hidden
  syncPartVisibilityForTimelineTime(handle, 3.1);
  assert.equal(handle.pillowsBack?.visible, true);
  assert.equal(handle.pillowsFront?.visible, false);

  // After pillowsFront stagger (t = 3.3), both pillows are visible
  syncPartVisibilityForTimelineTime(handle, 3.3);
  assert.equal(handle.pillowsFront?.visible, true);
});

test('computeOrbitCameraPosition maintains constant radius around the bed centre across a 180-degree orbit', () => {
  const start = computeOrbitCameraPosition(0);
  const quarter = computeOrbitCameraPosition(Math.PI / 2);
  const end = computeOrbitCameraPosition(Math.PI);

  const radiusAt = (pt: { x: number; z: number }) =>
    Math.hypot(pt.x - COMPLETE_ORBIT_CENTER.x, pt.z - COMPLETE_ORBIT_CENTER.z);

  assert.ok(Math.abs(radiusAt(start) - COMPLETE_ORBIT_RADIUS) < 1e-6);
  assert.ok(Math.abs(radiusAt(quarter) - COMPLETE_ORBIT_RADIUS) < 1e-6);
  assert.ok(Math.abs(radiusAt(end) - COMPLETE_ORBIT_RADIUS) < 1e-6);

  // Opposite three-quarter view at 180 deg has inverted X and Z relative to centre
  assert.ok(Math.abs(start.x + end.x) < 1e-6);
  assert.ok(Math.abs(start.z + end.z) < 1e-6);
});

test('computeFinalCameraPosition pushes camera 30% further back on mobile (<768px) and applies clamped desktop parallax', () => {
  const basePos = new THREE.Vector3(0, 1.5, 4.0);
  const target = new THREE.Vector3(0, 0.5, 0);
  const desktopDistance = basePos.distanceTo(target);

  // Mobile (<768px): 1.3x distance from target, mouse parallax ignored
  const mobilePos = computeFinalCameraPosition(basePos, target, 390, {
    x: 0.08,
    y: 0.08,
  });
  const mobileDistance = mobilePos.distanceTo(target);
  assert.ok(
    Math.abs(mobileDistance - desktopDistance * MOBILE_CAMERA_DISTANCE_MULTIPLIER) <
      1e-6
  );

  // Desktop (>=768px): 1.0x distance + parallax clamped to ±0.08
  const desktopPos = computeFinalCameraPosition(basePos, target, 1440, {
    x: 0.5,
    y: -0.5,
  });
  assert.ok(Math.abs(desktopPos.x - (basePos.x + MAX_DESKTOP_PARALLAX_UNITS)) < 1e-6);
  assert.ok(Math.abs(desktopPos.y - (basePos.y - MAX_DESKTOP_PARALLAX_UNITS)) < 1e-6);
});

test('groupWordsByOffsetTop groups words on the same vertical line and splits on new offsetTop', () => {
  const lines = groupWordsByOffsetTop([
    { word: 'Up', offsetTop: 0 },
    { word: 'to', offsetTop: 1 },
    { word: '70%', offsetTop: 0 },
    { word: 'off.', offsetTop: 38 },
    { word: 'Clearance', offsetTop: 39 },
    { word: 'stock,', offsetTop: 76 },
  ]);

  assert.deepEqual(lines, [
    ['Up', 'to', '70%'],
    ['off.', 'Clearance'],
    ['stock,'],
  ]);
});

test('CHAPTER_PROGRESS_STOPS, computeMonotonicProgress, and formatPreloaderCounter behave monotonically and format 000..100', () => {
  assert.deepEqual(
    CHAPTER_PROGRESS_STOPS.map((s) => s.label),
    ['Base', 'Mattress', 'Headboard', 'Pillows', 'Bedside', 'Lighting', 'Complete']
  );

  assert.equal(formatPreloaderCounter(0), '000');
  assert.equal(formatPreloaderCounter(7.2), '007');
  assert.equal(formatPreloaderCounter(42.8), '043');
  assert.equal(formatPreloaderCounter(100), '100');

  // Monotonic: never decreases if raw progress momentarily dips
  const p1 = computeMonotonicProgress(0, 48, true, 1, 2);
  assert.equal(p1, 48);
  const p2 = computeMonotonicProgress(p1, 25, true, 1, 2);
  assert.equal(p2, 48);
  const p3 = computeMonotonicProgress(p2, 100, false, 2, 2);
  assert.equal(p3, 100);
});

test('computeChapterProgressState hides during hero and after chapters, and highlights active stops 0..6', () => {
  const vh = 900;

  // At top of hero (scrollY = 0) -> hidden
  const heroState = computeChapterProgressState(0, 0, vh);
  assert.equal(heroState.isVisible, false);

  // At chapter-base (scrollY = 1 * vh) -> visible, activeStopIndex = 0 (Base)
  const baseState = computeChapterProgressState(vh, 0, vh);
  assert.equal(baseState.isVisible, true);
  assert.equal(baseState.activeStopIndex, 0);
  assert.equal(baseState.activeStopId, 'chapter-base');
  assert.ok(baseState.fillProgress > 0 && baseState.fillProgress < 0.2);

  // At chapter-headboard (scrollY = 3 * vh) -> visible, activeStopIndex = 2 (Headboard)
  const headboardState = computeChapterProgressState(3 * vh, 0, vh);
  assert.equal(headboardState.isVisible, true);
  assert.equal(headboardState.activeStopIndex, 2);
  assert.equal(headboardState.activeStopId, 'chapter-headboard');
  assert.ok(headboardState.fillProgress > 0.3 && headboardState.fillProgress < 0.5);

  // At chapter-complete (scrollY = 7 * vh) -> visible, activeStopIndex = 6 (Complete), fillProgress = 1
  const completeState = computeChapterProgressState(7 * vh, 0, vh);
  assert.equal(completeState.isVisible, true);
  assert.equal(completeState.activeStopIndex, 6);
  assert.equal(completeState.activeStopId, 'chapter-complete');
  assert.ok(Math.abs(completeState.fillProgress - 1) < 1e-6);

  // At more-sections-coming (scrollY = 8 * vh) -> hidden
  const afterState = computeChapterProgressState(8 * vh, 0, vh);
  assert.equal(afterState.isVisible, false);
});


