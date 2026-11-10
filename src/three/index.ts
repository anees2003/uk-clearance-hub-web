/**
 * UK Clearance Hub — 3D Scene Foundation (/src/three)
 * Step 1 foundation placeholder. 3D scene and Bed 07 model (Doaa Sheha, CC BY 4.0)
 * will be implemented in subsequent steps.
 */

export interface SceneCameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export const BED_MODEL_ATTRIBUTION = {
  title: 'Bed 07',
  author: 'Doaa Sheha',
  platform: 'Sketchfab',
  licence: 'CC BY 4.0',
} as const;
