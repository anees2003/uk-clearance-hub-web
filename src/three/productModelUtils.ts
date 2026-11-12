import * as THREE from 'three';
import { gsap } from '../animations/gsap';
import { BED_PART_KEYS, BedPartKey, BedSetHandle } from './bedParts';
import {
  ProductCategory,
  computeBedSizeZOffsets,
} from '../data/deals';

export interface CategoryCameraFraming {
  cameraPosition: [number, number, number];
  orbitTarget: [number, number, number];
  minDistance: number;
  maxDistance: number;
  rotationY: number;
}

export const CATEGORY_CAMERA_FRAMING: Record<
  ProductCategory,
  CategoryCameraFraming
> = {
  Beds: {
    cameraPosition: [0, 1.55, 4.9],
    orbitTarget: [0, 0.42, 0],
    minDistance: 2.6,
    maxDistance: 8.0,
    rotationY: -Math.PI * 0.34,
  },
  Mattresses: {
    cameraPosition: [0, 1.18, 3.65],
    orbitTarget: [0, 0.22, 0],
    minDistance: 2.0,
    maxDistance: 6.5,
    rotationY: -Math.PI * 0.32,
  },
  Headboards: {
    cameraPosition: [0, 0.92, 3.35],
    orbitTarget: [0, 0.56, 0],
    minDistance: 1.8,
    maxDistance: 6.0,
    rotationY: -Math.PI * 0.42,
  },
  'Bedside tables': {
    cameraPosition: [0, 0.95, 2.95],
    orbitTarget: [0, 0.56, 0],
    minDistance: 1.5,
    maxDistance: 5.0,
    rotationY: -Math.PI * 0.38,
  },
};

export function getVisiblePartKeysForCategory(
  category: ProductCategory
): BedPartKey[] {
  switch (category) {
    case 'Beds':
      return [...BED_PART_KEYS];
    case 'Mattresses':
      return ['mattress'];
    case 'Headboards':
      return ['headboard'];
    case 'Bedside tables':
      return ['nightstandLeft', 'lampLeft'];
  }
}

/**
 * Isolates only the nodes belonging to `category`, restores their original local transforms,
 * and centres the visible node(s) at (0, 0, 0) resting flush on the studio floor (y = 0).
 */
export function applyCategoryIsolationAndCentring(
  handle: BedSetHandle,
  category: ProductCategory,
  customRotationY?: number
): void {
  const { parts, originalTransforms, bedGroup, lampLightLeft, lampLightRight } =
    handle;
  if (!bedGroup) return;

  const visibleKeys = new Set<BedPartKey>(
    getVisiblePartKeysForCategory(category)
  );

  // 1. Reset every part to its original transform and set category visibility
  for (const key of BED_PART_KEYS) {
    const node = parts[key];
    const orig = originalTransforms[key];
    if (!node || !orig) continue;

    node.position.copy(orig.position);
    node.rotation.copy(orig.rotation);
    node.scale.copy(orig.scale);
    node.visible = visibleKeys.has(key);
  }

  // 2. Configure warm bedside point lights
  if (lampLightLeft) {
    const leftOrig = originalTransforms.lampLeft.position;
    lampLightLeft.position.set(leftOrig.x, leftOrig.y + 0.16, leftOrig.z);
    lampLightLeft.intensity =
      category === 'Beds' || category === 'Bedside tables' ? 1.2 : 0;
  }
  if (lampLightRight) {
    const rightOrig = originalTransforms.lampRight.position;
    lampLightRight.position.set(rightOrig.x, rightOrig.y + 0.16, rightOrig.z);
    lampLightRight.intensity = category === 'Beds' ? 1.2 : 0;
  }

  // 3. Measure world bounding box of ONLY the visible parts and centre them on the floor (y = 0)
  const framing = CATEGORY_CAMERA_FRAMING[category];
  const rotY = customRotationY ?? framing.rotationY;
  bedGroup.position.set(0, 0, 0);
  bedGroup.rotation.set(0, rotY, 0);
  bedGroup.updateMatrixWorld(true);

  const visibleBox = new THREE.Box3();
  for (const key of visibleKeys) {
    const node = parts[key];
    if (node) {
      const partBox = new THREE.Box3().setFromObject(node);
      visibleBox.union(partBox);
    }
  }

  if (!visibleBox.isEmpty()) {
    const center = visibleBox.getCenter(new THREE.Vector3());
    bedGroup.position.set(-center.x, -visibleBox.min.y, -center.z);
    bedGroup.updateMatrixWorld(true);
  }

  handle.invalidate?.();
}

/**
 * Smoothly tweens the Z-width scale of Base, Mattress, Headboard, and Pillows
 * and shifts Nightstands + Lamps along Z so they remain just outside the bed edges.
 */
export function tweenBedSetWidthScale(
  handle: BedSetHandle,
  widthScale: number,
  immediate = false
): gsap.core.Timeline {
  const { parts, originalTransforms, lampLightLeft, lampLightRight } = handle;

  const origBedCenterZ = originalTransforms.mattress.position.z;
  // Half-width of King mattress/base in local Z units (~0.95 units)
  const origBedHalfWidthZ = 0.95;

  const offsets = computeBedSizeZOffsets(
    widthScale,
    origBedCenterZ,
    origBedHalfWidthZ,
    originalTransforms.nightstandLeft.position.z,
    originalTransforms.nightstandRight.position.z
  );

  const duration = immediate ? 0 : 0.72;
  const tl = gsap.timeline({
    defaults: { duration, ease: 'power3.out', overwrite: 'auto' },
    onUpdate: () => handle.invalidate?.(),
    onComplete: () => handle.invalidate?.(),
  });

  const widthScaledKeys: BedPartKey[] = [
    'base',
    'mattress',
    'headboard',
    'pillowsBack',
    'pillowsFront',
  ];

  for (const key of widthScaledKeys) {
    const node = parts[key];
    const orig = originalTransforms[key];
    if (!node || !orig) continue;
    tl.to(
      node.scale,
      {
        z: orig.scale.z * offsets.scaleZMultiplier,
      },
      0
    );
  }

  // Shift left nightstand + left lamp + left pointLight
  if (parts.nightstandLeft) {
    tl.to(
      parts.nightstandLeft.position,
      {
        z: originalTransforms.nightstandLeft.position.z + offsets.leftDeltaZ,
      },
      0
    );
  }
  if (parts.lampLeft) {
    tl.to(
      parts.lampLeft.position,
      {
        z: originalTransforms.lampLeft.position.z + offsets.leftDeltaZ,
      },
      0
    );
  }
  if (lampLightLeft) {
    tl.to(
      lampLightLeft.position,
      {
        z: originalTransforms.lampLeft.position.z + offsets.leftDeltaZ,
      },
      0
    );
  }

  // Shift right nightstand + right lamp + right pointLight
  if (parts.nightstandRight) {
    tl.to(
      parts.nightstandRight.position,
      {
        z: originalTransforms.nightstandRight.position.z + offsets.rightDeltaZ,
      },
      0
    );
  }
  if (parts.lampRight) {
    tl.to(
      parts.lampRight.position,
      {
        z: originalTransforms.lampRight.position.z + offsets.rightDeltaZ,
      },
      0
    );
  }
  if (lampLightRight) {
    tl.to(
      lampLightRight.position,
      {
        z: originalTransforms.lampRight.position.z + offsets.rightDeltaZ,
      },
      0
    );
  }

  if (immediate) {
    tl.progress(1);
  }

  return tl;
}

/**
 * Smoothly tweens the upholstery/frame material colour on the target category parts
 * while preserving the original PBR textures.
 */
export function tweenBedSetMaterialColour(
  handle: BedSetHandle,
  category: ProductCategory,
  hexColour: string,
  immediate = false
): gsap.core.Timeline {
  const { parts } = handle;
  const targetColor = new THREE.Color(hexColour);
  const white = new THREE.Color('#FFFFFF');

  const primaryTintKeys: BedPartKey[] =
    category === 'Beds'
      ? ['headboard', 'base']
      : category === 'Mattresses'
        ? ['mattress']
        : category === 'Headboards'
          ? ['headboard']
          : ['nightstandLeft', 'lampLeft'];

  const secondaryTintKeys: BedPartKey[] =
    category === 'Beds' ? ['pillowsBack', 'pillowsFront', 'mattress'] : [];

  const duration = immediate ? 0 : 0.6;
  const tl = gsap.timeline({
    defaults: { duration, ease: 'power2.out', overwrite: 'auto' },
    onUpdate: () => handle.invalidate?.(),
    onComplete: () => handle.invalidate?.(),
  });

  const collectAndTween = (keys: BedPartKey[], blendFactor: number) => {
    const blended = white.clone().lerp(targetColor, blendFactor);

    for (const key of keys) {
      const root = parts[key];
      if (!root) continue;

      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;

        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((mat) => {
          const stdMat = mat as THREE.MeshStandardMaterial;
          if (stdMat && stdMat.color) {
            tl.to(
              stdMat.color,
              {
                r: blended.r,
                g: blended.g,
                b: blended.b,
              },
              0
            );
          }
        });
      });
    }
  };

  collectAndTween(primaryTintKeys, 0.85);
  if (secondaryTintKeys.length > 0) {
    collectAndTween(secondaryTintKeys, 0.35);
  }

  if (immediate) {
    tl.progress(1);
  }

  return tl;
}
