import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { MODEL_URL } from './modelUrl';
import {
  BED_PART_KEYS,
  BedSetHandle,
  extractBedPartsAndTransforms,
} from './bedParts';
import {
  CAMERA_KEYFRAMES,
  MAX_DESKTOP_PARALLAX_UNITS,
  MOBILE_BREAKPOINT_PX,
  computeFinalCameraPosition,
} from '../animations/useAssemblyTimeline';
import { gsap } from '../animations/gsap';
import { APP_READY_EVENT, isAppReady } from '../components/layout/Preloader';

// Preload the GLB model once at module evaluation (Draco decoder enabled if compressed GLB is provided later)
useGLTF.preload(MODEL_URL, true);

let hasLoggedNodesInDev = false;

export interface BedSetProps {
  /**
   * Optional rotation override for the root "Bed" group around Y.
   * Defaults to -Math.PI * 0.34 (~-61 deg) so that when viewed from +Z,
   * the bed (whose head points to -X and foot points to +X) is seen from a
   * flattering front-three-quarter angle.
   */
  rotationY?: number;
  /**
   * Whether parts should start visible in their assembled pose before any timeline runs.
   * On the scroll-assembly Home page, set to false so all parts start hidden in chapter-hero.
   */
  initialAssembled?: boolean;
  /**
   * Callback fired once the BedSet cloned scene, parts, and original transforms are ready.
   */
  onReady?: (handle: BedSetHandle) => void;
  /**
   * When true (e.g. inside an OrbitControls product viewer), BedSet will not overwrite
   * the camera position/target every frame so OrbitControls can freely orbit and auto-rotate.
   */
  disableCameraRig?: boolean;
}

export const BedSet = forwardRef<BedSetHandle, BedSetProps>(
  (
    {
      rotationY = -Math.PI * 0.34,
      initialAssembled = true,
      onReady,
      disableCameraRig = false,
    },
    ref
  ) => {
    const gltf = useGLTF(MODEL_URL, true);
    const gl = useThree((state) => state.gl);
    const camera = useThree((state) => state.camera);
    const invalidate = useThree((state) => state.invalidate);

    // GSAP-animated camera position and lookAt target Vector3 instances
    const cameraPosition = useMemo(
      () =>
        initialAssembled
          ? new THREE.Vector3(0, 1.5, 5.1)
          : CAMERA_KEYFRAMES.hero.position.clone(),
      [initialAssembled]
    );
    const cameraTarget = useMemo(
      () =>
        initialAssembled
          ? new THREE.Vector3(0, 0.36, 0)
          : CAMERA_KEYFRAMES.hero.target.clone(),
      [initialAssembled]
    );

    // Desktop-only subtle mouse parallax state (max ±0.08 units, disabled when mouse is idle)
    const targetParallaxRef = useRef({ x: 0, y: 0 });
    const currentParallaxRef = useRef({ x: 0, y: 0 });
    const mouseIdleTimerRef = useRef<number | null>(null);

    // One-time gentle 1.5s ease-out intro dolly offset on "app:ready" (never fights scroll timeline)
    const introDollyRef = useRef({
      yOffset: !initialAssembled && !isAppReady() ? 0.22 : 0,
      zOffset: !initialAssembled && !isAppReady() ? 1.15 : 0,
    });
    const hasPlayedIntroDollyRef = useRef<boolean>(initialAssembled || isAppReady());

    const {
      clonedScene,
      bedGroup,
      parts,
      originalTransforms,
      lampLightLeft,
      lampLightRight,
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
      // Clone materials per BedSet instance so colour swatch tweens never affect other scenes.
      const maxAnisotropy = gl.capabilities.getMaxAnisotropy();

      sceneClone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => (m ? m.clone() : m));
          } else if (mesh.material) {
            mesh.material = mesh.material.clone();
          }

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

      // 6. Create warm pointLights (#FFD9A0, distance 2.5, decay 2) inside each lamp shade
      const leftLight = new THREE.PointLight('#FFD9A0', initialAssembled ? 1.2 : 0, 2.5, 2);
      const leftLampOrig = extracted.originalTransforms.lampLeft.position;
      leftLight.position.set(leftLampOrig.x, leftLampOrig.y + 0.16, leftLampOrig.z);
      targetBedGroup.add(leftLight);

      const rightLight = new THREE.PointLight('#FFD9A0', initialAssembled ? 1.2 : 0, 2.5, 2);
      const rightLampOrig = extracted.originalTransforms.lampRight.position;
      rightLight.position.set(rightLampOrig.x, rightLampOrig.y + 0.16, rightLampOrig.z);
      targetBedGroup.add(rightLight);

      // 7. If initialAssembled is false (e.g., Home scroll assembly), hide all parts initially
      if (!initialAssembled) {
        for (const key of BED_PART_KEYS) {
          const part = extracted.parts[key];
          if (part) {
            part.visible = false;
          }
        }
      }

      return {
        clonedScene: sceneClone,
        bedGroup: targetBedGroup,
        parts: extracted.parts,
        originalTransforms: extracted.originalTransforms,
        lampLightLeft: leftLight,
        lampLightRight: rightLight,
      };
    }, [gltf.scene, gl, rotationY, initialAssembled]);

    const coalescedInvalidate = useMemo(() => {
      let timerId: number | null = null;
      let lastCall = 0;
      return () => {
        const now = performance.now();
        if (now - lastCall > 480) {
          lastCall = now;
          invalidate();
        }
        if (timerId !== null) {
          window.clearTimeout(timerId);
        }
        timerId = window.setTimeout(() => {
          lastCall = performance.now();
          invalidate();
          timerId = null;
        }, 120);
      };
    }, [invalidate]);

    const applyCameraTransform = useCallback(
      (deltaSeconds = 0.016) => {
        const viewportWidth =
          typeof window !== 'undefined' ? window.innerWidth : 1440;

        currentParallaxRef.current.x = THREE.MathUtils.damp(
          currentParallaxRef.current.x,
          targetParallaxRef.current.x,
          8,
          deltaSeconds
        );
        currentParallaxRef.current.y = THREE.MathUtils.damp(
          currentParallaxRef.current.y,
          targetParallaxRef.current.y,
          8,
          deltaSeconds
        );

        computeFinalCameraPosition(
          cameraPosition,
          cameraTarget,
          viewportWidth,
          currentParallaxRef.current,
          camera.position
        );

        if (
          introDollyRef.current.yOffset !== 0 ||
          introDollyRef.current.zOffset !== 0
        ) {
          camera.position.y += introDollyRef.current.yOffset;
          camera.position.z += introDollyRef.current.zOffset;
        }

        camera.lookAt(cameraTarget);
        camera.updateMatrixWorld();
      },
      [camera, cameraPosition, cameraTarget]
    );

    // Call camera.lookAt(target) every frame via useFrame when scroll camera rig is active
    useFrame((_, delta) => {
      if (disableCameraRig) return;
      applyCameraTransform(Math.min(delta, 0.1));
    });

    // Gentle 1.5s ease-out camera dolly into hero position once "app:ready" fires
    useEffect(() => {
      if (disableCameraRig || initialAssembled || hasPlayedIntroDollyRef.current) return;

      let dollyTween: gsap.core.Tween | null = null;

      const playIntroDolly = () => {
        if (hasPlayedIntroDollyRef.current) return;
        hasPlayedIntroDollyRef.current = true;

        // If user has already scrolled down, skip dolly so we never fight the scroll timeline
        if (typeof window !== 'undefined' && window.scrollY > 10) {
          introDollyRef.current.yOffset = 0;
          introDollyRef.current.zOffset = 0;
          applyCameraTransform(0.016);
          coalescedInvalidate();
          return;
        }

        dollyTween = gsap.to(introDollyRef.current, {
          yOffset: 0,
          zOffset: 0,
          duration: 1.5,
          ease: 'power3.out',
          onUpdate: () => {
            if (typeof window !== 'undefined' && window.scrollY > 10) {
              dollyTween?.kill();
              introDollyRef.current.yOffset = 0;
              introDollyRef.current.zOffset = 0;
            }
            applyCameraTransform(0.016);
            coalescedInvalidate();
          },
          onComplete: () => {
            introDollyRef.current.yOffset = 0;
            introDollyRef.current.zOffset = 0;
            applyCameraTransform(0.016);
            coalescedInvalidate();
          },
        });
      };

      if (isAppReady()) {
        playIntroDolly();
      } else {
        window.addEventListener(APP_READY_EVENT, playIntroDolly, { once: true });
      }

      return () => {
        window.removeEventListener(APP_READY_EVENT, playIntroDolly);
        dollyTween?.kill();
      };
    }, [disableCameraRig, initialAssembled, applyCameraTransform, coalescedInvalidate]);

    // Desktop-only subtle mouse parallax (max ±0.08 units, disabled when not moving mouse or when reduced motion is preferred)
    useEffect(() => {
      if (disableCameraRig || typeof window === 'undefined') return;

      const isReducedMotion = () =>
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const handleMouseMove = (event: MouseEvent) => {
        if (window.innerWidth < MOBILE_BREAKPOINT_PX || isReducedMotion()) {
          targetParallaxRef.current.x = 0;
          targetParallaxRef.current.y = 0;
          return;
        }

        const nx = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        const ny = -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);

        targetParallaxRef.current.x = THREE.MathUtils.clamp(
          nx * MAX_DESKTOP_PARALLAX_UNITS,
          -MAX_DESKTOP_PARALLAX_UNITS,
          MAX_DESKTOP_PARALLAX_UNITS
        );
        targetParallaxRef.current.y = THREE.MathUtils.clamp(
          ny * MAX_DESKTOP_PARALLAX_UNITS,
          -MAX_DESKTOP_PARALLAX_UNITS,
          MAX_DESKTOP_PARALLAX_UNITS
        );

        applyCameraTransform(0.016);
        coalescedInvalidate();

        if (mouseIdleTimerRef.current !== null) {
          window.clearTimeout(mouseIdleTimerRef.current);
        }
        mouseIdleTimerRef.current = window.setTimeout(() => {
          targetParallaxRef.current.x = 0;
          targetParallaxRef.current.y = 0;
          applyCameraTransform(0.05);
          coalescedInvalidate();
          mouseIdleTimerRef.current = null;
        }, 180);
      };

      const handleResize = () => {
        if (window.innerWidth < MOBILE_BREAKPOINT_PX || isReducedMotion()) {
          targetParallaxRef.current.x = 0;
          targetParallaxRef.current.y = 0;
          currentParallaxRef.current.x = 0;
          currentParallaxRef.current.y = 0;
        }
        applyCameraTransform(0.016);
        coalescedInvalidate();
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (mouseIdleTimerRef.current !== null) {
          window.clearTimeout(mouseIdleTimerRef.current);
        }
      };
    }, [disableCameraRig, applyCameraTransform, coalescedInvalidate]);

    // Dispose cloned per-instance materials when unmounting to prevent GPU memory leaks
    useEffect(() => {
      return () => {
        clonedScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            materials.forEach((mat) => {
              if (mat && typeof mat.dispose === 'function') {
                mat.dispose();
              }
            });
          }
        });
      };
    }, [clonedScene]);

    const handleObject = useMemo<BedSetHandle>(
      () => ({
        ...parts,
        parts,
        originalTransforms,
        bedGroup,
        lampLightLeft,
        lampLightRight,
        cameraPosition,
        cameraTarget,
        syncCamera: () => applyCameraTransform(0.016),
        invalidate: coalescedInvalidate,
      }),
      [
        parts,
        originalTransforms,
        bedGroup,
        lampLightLeft,
        lampLightRight,
        cameraPosition,
        cameraTarget,
        applyCameraTransform,
        coalescedInvalidate,
      ]
    );

    useImperativeHandle(ref, () => handleObject, [handleObject]);

    useEffect(() => {
      if (!disableCameraRig) {
        applyCameraTransform(0.016);
      }
      onReady?.(handleObject);
    }, [disableCameraRig, applyCameraTransform, onReady, handleObject]);

    return <primitive object={clonedScene} />;
  }
);

BedSet.displayName = 'BedSet';
