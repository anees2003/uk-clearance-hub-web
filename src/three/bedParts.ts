import * as THREE from 'three';

export const EXPECTED_BED_NODE_MAP = {
  base: 'Base',
  mattress: 'Mattress',
  headboard: 'Headboard',
  pillowsBack: 'Pillows_Back',
  pillowsFront: 'Pillows_Front',
  nightstandLeft: 'Nightstand_Left',
  nightstandRight: 'Nightstand_Right',
  lampLeft: 'Lamp_Left',
  lampRight: 'Lamp_Right',
} as const;

export type BedPartKey = keyof typeof EXPECTED_BED_NODE_MAP;
export type BedNodeName = (typeof EXPECTED_BED_NODE_MAP)[BedPartKey];

export const BED_PART_KEYS = Object.keys(EXPECTED_BED_NODE_MAP) as BedPartKey[];
export const EXPECTED_BED_NODE_NAMES = Object.values(EXPECTED_BED_NODE_MAP) as BedNodeName[];

export interface BedPartTransform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

export type BedPartsMap = {
  [K in BedPartKey]: THREE.Object3D | null;
};

export type BedOriginalTransformsMap = {
  [K in BedPartKey]: BedPartTransform;
};

export interface BedSetHandle extends BedPartsMap {
  parts: BedPartsMap;
  originalTransforms: BedOriginalTransformsMap;
  bedGroup: THREE.Object3D | null;
}

export interface ExtractedBedPartsResult {
  parts: BedPartsMap;
  originalTransforms: BedOriginalTransformsMap;
  foundNodeNames: BedNodeName[];
  missingNodeNames: BedNodeName[];
}

/**
 * Extracts all 9 expected bed nodes from a lookup dictionary (nodes.<Name>)
 * and records their original local position, rotation, and scale.
 */
export function extractBedPartsAndTransforms(
  nodes: Record<string, THREE.Object3D | undefined>
): ExtractedBedPartsResult {
  const parts = {} as BedPartsMap;
  const originalTransforms = {} as BedOriginalTransformsMap;
  const foundNodeNames: BedNodeName[] = [];
  const missingNodeNames: BedNodeName[] = [];

  for (const key of BED_PART_KEYS) {
    const nodeName = EXPECTED_BED_NODE_MAP[key];
    const node = nodes[nodeName] ?? null;
    parts[key] = node;

    if (node) {
      foundNodeNames.push(nodeName);
      originalTransforms[key] = {
        position: node.position.clone(),
        rotation: node.rotation.clone(),
        scale: node.scale.clone(),
      };
    } else {
      missingNodeNames.push(nodeName);
      originalTransforms[key] = {
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        scale: new THREE.Vector3(1, 1, 1),
      };
    }
  }

  return {
    parts,
    originalTransforms,
    foundNodeNames,
    missingNodeNames,
  };
}
