import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { MODEL_URL } from './modelUrl';
import {
  EXPECTED_BED_NODE_NAMES,
  BED_PART_KEYS,
  extractBedPartsAndTransforms,
} from './bedParts';

test('MODEL_URL points to the official UK Clearance Hub bed.glb CDN URL', () => {
  assert.equal(
    MODEL_URL,
    'https://cdn.jsdelivr.net/gh/anees2003/uk-clearance-hub@main/bed.glb'
  );
});

test('extractBedPartsAndTransforms maps all 9 expected bed nodes and clones their original transforms', () => {
  const mockNodes: Record<string, THREE.Object3D> = {};

  EXPECTED_BED_NODE_NAMES.forEach((name, idx) => {
    const obj = new THREE.Object3D();
    obj.name = name;
    obj.position.set(idx, idx * 0.5, -idx);
    obj.rotation.set(0, idx * 0.1, 0);
    obj.scale.set(1, 1, 1);
    mockNodes[name] = obj;
  });

  const result = extractBedPartsAndTransforms(mockNodes);

  assert.equal(result.foundNodeNames.length, 9);
  assert.equal(result.missingNodeNames.length, 0);
  assert.equal(BED_PART_KEYS.length, 9);

  // Verify mutating the live object does not mutate originalTransforms
  result.parts.mattress!.position.set(99, 99, 99);
  assert.notEqual(result.originalTransforms.mattress.position.x, 99);
  assert.equal(result.originalTransforms.mattress.position.x, 1);
});

test('extractBedPartsAndTransforms reports missing nodes when a node is absent', () => {
  const partialNodes: Record<string, THREE.Object3D> = {
    Base: new THREE.Object3D(),
  };
  const result = extractBedPartsAndTransforms(partialNodes);
  assert.equal(result.foundNodeNames.length, 1);
  assert.equal(result.missingNodeNames.length, 8);
  assert.ok(result.missingNodeNames.includes('Lamp_Right'));
});
