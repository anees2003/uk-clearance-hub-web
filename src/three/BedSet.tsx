import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { MODEL_URL } from './modelUrl';
import {
  BedSetHandle,
  extractBedPartsAndTransforms,
} from './bedParts';

// Preload the GLB model once at module evaluation
useGLTF.preload(MODEL_URL);

let hasLoggedNodesInDev = false;

export interface BedSetProps {
  /**
   * Optional rotation override for the root "Bed" group around Y.
   * Defaults to -Math.PI * 0.34 (~-61 deg) so that when viewed from +Z,
   * the bed (whose head points to -X and foot points to +X) is seen from a
   * flattering front-three-quarter angle.
   */
  rotationY?: number;
}

export const BedSet = forwardRef<BedSetHandle, BedSetProps>(
  ({ rotationY = -Math.PI * 0.34 }, ref) => {
    const gltf = useGLTF(MODEL_URL);
    const gl = useThree((state) => state.gl);

    const {
      clonedScene,
      bedGroup,
      parts,
      originalTransforms,
    } = useMemo(() => {
      // 1. Clone the loaded GLTF scene so materials/transforms are isolated per instance
      const sceneClone = gltf.scene.clone(true);

      // 2. Build a nodes.<Name> map from the cloned scene graph
      const nodes: Record<string, THREE.Object3D> = {};
      sceneClone.traverse((obj) => {
        if (obj.name) {
          nodes[obj.name] = obj;
        }
      });

      // 3. Extract the 9 named parts via nodes.<Name> and capture their ORIGINAL transforms
      const extracted = extractBedPartsAndTransforms({
        Base: nodes.Base,
        Mattress: nodes.Mattress,
        Headboard: nodes.Headboard,
        Pillows_Back: nodes.Pillows_Back,
        Pillows_Front: nodes.Pillows_Front,
        Nightstand_Left: nodes.Nightstand_Left,
        Nightstand_Right: nodes.Nightstand_Right,
        Lamp_Left: nodes.Lamp_Left,
        Lamp_Right: nodes.Lamp_Right,
      });

      if (import.meta.env.DEV && !hasLoggedNodesInDev) {
        console.log('[BedSet] Found GLB nodes (9/9 expected):', extracted.foundNodeNames);
        hasLoggedNodesInDev = true;
      }

      if (extracted.missingNodeNames.length > 0) {
        console.warn(
          '[BedSet] Missing expected GLB nodes in bed.glb:',
          extracted.missingNodeNames
        );
      }

      // 4. Configure materials, textures, anisotropy, and shadows on every mesh
      const maxAnisotropy = gl.capabilities.getMaxAnisotropy();

      sceneClone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((mat) => {
            if (!mat) return;
            const stdMat = mat as THREE.MeshStandardMaterial;

            if ('emissiveIntensity' in stdMat) {
              stdMat.emissiveIntensity = 0.15;
            }
            if ('envMapIntensity' in stdMat) {
              stdMat.envMapIntensity = 1.0;
            }

            const textureSlots = [
              stdMat.map,
              stdMat.emissiveMap,
              stdMat.normalMap,
              stdMat.roughnessMap,
              stdMat.metalnessMap,
              stdMat.aoMap,
            ];

            textureSlots.forEach((tex) => {
              if (tex) {
                tex.anisotropy = maxAnisotropy;
                tex.needsUpdate = true;
              }
            });

            stdMat.needsUpdate = true;
          });
        }
      });

      // 5. Orient the "Bed" group for a flattering front-three-quarter angle
      // and place it so it sits flush on the floor (y = 0) and centered horizontally.
      const targetBedGroup = nodes.Bed ?? sceneClone;
      targetBedGroup.position.set(0, 0, 0);
      targetBedGroup.rotation.set(0, rotationY, 0);
      targetBedGroup.updateMatrixWorld(true);

      const boundingBox = new THREE.Box3().setFromObject(targetBedGroup);
      const center = boundingBox.getCenter(new THREE.Vector3());

      targetBedGroup.position.set(
        -center.x,
        -boundingBox.min.y,
        -center.z
      );
      targetBedGroup.updateMatrixWorld(true);

      return {
        clonedScene: sceneClone,
        bedGroup: targetBedGroup,
        parts: extracted.parts,
        originalTransforms: extracted.originalTransforms,
      };
    }, [gltf.scene, gl, rotationY]);

    useImperativeHandle(
      ref,
      () => ({
        ...parts,
        parts,
        originalTransforms,
        bedGroup,
      }),
      [parts, originalTransforms, bedGroup]
    );

    return <primitive object={clonedScene} />;
  }
);

BedSet.displayName = 'BedSet';
