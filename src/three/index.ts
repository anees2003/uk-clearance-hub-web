export { MODEL_URL } from './modelUrl';
export {
  EXPECTED_BED_NODE_MAP,
  BED_PART_KEYS,
  EXPECTED_BED_NODE_NAMES,
  extractBedPartsAndTransforms,
} from './bedParts';
export type {
  BedPartKey,
  BedNodeName,
  BedPartTransform,
  BedPartsMap,
  BedOriginalTransformsMap,
  BedSetHandle,
} from './bedParts';
export { BedSet } from './BedSet';
export type { BedSetProps } from './BedSet';
export { StudioScene, useStudioProgress } from './StudioScene';
export type { StudioSceneProps, StudioLoadingProgress } from './StudioScene';

export const BED_MODEL_ATTRIBUTION = {
  title: 'Bed 07',
  author: 'Doaa Sheha',
  platform: 'Sketchfab',
  licence: 'CC BY 4.0',
} as const;
