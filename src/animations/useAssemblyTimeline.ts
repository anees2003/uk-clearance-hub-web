import { RefObject, useEffect } from 'react';
import * as THREE from 'three';
import { gsap, ScrollTrigger } from './gsap';
import { BedSetHandle } from '../three/bedParts';
import {
  ASSEMBLY_CHAPTERS,
  ChapterDefinition,
} from '../data/assemblyChapters';

export { ASSEMBLY_CHAPTERS };
export type { ChapterDefinition };

export const PART_ACTIVATION_TIMES = {
  base: 0.25,
  mattress: 1.0,
  headboard: 2.0,
  pillowsBack: 3.0,
  pillowsFront: 3.15,
  nightstandLeft: 4.0,
  nightstandRight: 4.0,
  lampLeft: 5.0,
  lampRight: 5.0,
} as const;

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const COMPLETE_ORBIT_CENTER = new THREE.Vector3(0, 1.08, 0);
export const COMPLETE_ORBIT_RADIUS = 5.85;
export const COMPLETE_ORBIT_HEIGHT = 1.92;
/**
 * Start angle (-0.503 rad = -28.8 deg) is the front-left three-quarter view of the bed;
 * orbiting +Math.PI (180 deg) sweeps around the bed to +2.639 rad (+151.2 deg),
 * ending on the opposite three-quarter view.
 */
export const COMPLETE_ORBIT_START_ANGLE = -Math.PI * 0.16;

export const MOBILE_BREAKPOINT_PX = 768;
export const MOBILE_CAMERA_DISTANCE_MULTIPLIER = 1.3;
export const MAX_DESKTOP_PARALLAX_UNITS = 0.08;

/**
 * Computes the camera position along a constant-radius circle around the bed's centre
 * for the 180° orbit in the `complete` chapter (angleOffsetRad: 0 -> Math.PI).
 */
export function computeOrbitCameraPosition(
  angleOffsetRad: number,
  center: THREE.Vector3 = COMPLETE_ORBIT_CENTER,
  radius: number = COMPLETE_ORBIT_RADIUS,
  height: number = COMPLETE_ORBIT_HEIGHT,
  startAngleRad: number = COMPLETE_ORBIT_START_ANGLE
): { x: number; y: number; z: number } {
  const worldAngle = startAngleRad + angleOffsetRad;
  return {
    x: center.x + radius * Math.sin(worldAngle),
    y: height,
    z: center.z + radius * Math.cos(worldAngle),
  };
}

const completeStartPos = computeOrbitCameraPosition(0);
const completeEndPos = computeOrbitCameraPosition(Math.PI);

/**
 * Chapter-by-chapter camera poses framing the active part while keeping the
 * opposite side of the viewport open for the alternating left/right text panels.
 */
export const CAMERA_KEYFRAMES = {
  // hero: wide, slightly high establishing shot of the empty studio floor
  hero: {
    position: new THREE.Vector3(0.0, 2.35, 6.2),
    target: new THREE.Vector3(0.0, 0.25, 0.0),
  },
  // base (panel left): low angle, closer, looking at the base/legs area (framed right of left panel)
  base: {
    position: new THREE.Vector3(-0.45, 0.52, 4.25),
    target: new THREE.Vector3(-0.82, 0.20, 0.0),
  },
  // mattress (panel right): medium shot from foot-side three-quarter angle, slightly above mattress (framed left of right panel)
  mattress: {
    position: new THREE.Vector3(1.45, 1.18, 4.15),
    target: new THREE.Vector3(0.85, 0.34, 0.0),
  },
  // headboard (panel left): closer shot towards head end, eye level with headboard (framed right of left panel)
  headboard: {
    position: new THREE.Vector3(-0.85, 0.72, 3.65),
    target: new THREE.Vector3(-1.38, 0.50, -0.65),
  },
  // pillows (panel right): close-up over the pillows, gently looking down (framed left of right panel)
  pillows: {
    position: new THREE.Vector3(0.95, 1.32, 2.85),
    target: new THREE.Vector3(0.48, 0.48, -0.35),
  },
  // bedside (panel left): pull back wide enough to fit both nightstands (framed right of left panel)
  bedside: {
    position: new THREE.Vector3(-0.85, 1.58, 5.85),
    target: new THREE.Vector3(-1.08, 0.36, -0.20),
  },
  // lighting (panel right): medium shot including one lamp (Lamp_Left), warm and intimate (framed left of right panel)
  lighting: {
    position: new THREE.Vector3(1.25, 0.96, 2.35),
    target: new THREE.Vector3(0.92, 0.62, -1.05),
  },
  // complete (panel centred): starts from front three-quarter view and orbits 180 deg around the bed's centre
  completeStart: {
    position: new THREE.Vector3(completeStartPos.x, completeStartPos.y, completeStartPos.z),
    target: COMPLETE_ORBIT_CENTER.clone(),
  },
  completeEnd: {
    position: new THREE.Vector3(completeEndPos.x, completeEndPos.y, completeEndPos.z),
    target: COMPLETE_ORBIT_CENTER.clone(),
  },
} as const;

/**
 * Applies the ~30% mobile distance pushback (when viewportWidth < 768) and
 * desktop-only mouse parallax (clamped to ±0.08 units) on top of the scroll camera.
 */
export function computeFinalCameraPosition(
  basePosition: THREE.Vector3,
  target: THREE.Vector3,
  viewportWidth: number,
  parallaxOffset: { x: number; y: number },
  outVector: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  const isMobile = viewportWidth < MOBILE_BREAKPOINT_PX;
  const distanceMultiplier = isMobile ? MOBILE_CAMERA_DISTANCE_MULTIPLIER : 1.0;

  outVector
    .copy(basePosition)
    .sub(target)
    .multiplyScalar(distanceMultiplier)
    .add(target);

  if (!isMobile) {
    const px = THREE.MathUtils.clamp(
      parallaxOffset.x,
      -MAX_DESKTOP_PARALLAX_UNITS,
      MAX_DESKTOP_PARALLAX_UNITS
    );
    const py = THREE.MathUtils.clamp(
      parallaxOffset.y,
      -MAX_DESKTOP_PARALLAX_UNITS,
      MAX_DESKTOP_PARALLAX_UNITS
    );
    outVector.x += px;
    outVector.y += py;
  }

  return outVector;
}

/**
 * Computes the position and Z-rotation of the Headboard when rotating around its bottom edge.
 * At angleRad = Math.PI / 2 (90 deg backwards), the headboard lies flat behind the bed (-X).
 * At angleRad = 0, the headboard sits upright at its original transform.
 */
export function computeHeadboardHingePose(
  origPos: THREE.Vector3,
  origRot: THREE.Euler,
  bottomOffsetY: number,
  angleRad: number
): { x: number; y: number; z: number; rotZ: number } {
  const hingeY = origPos.y - bottomOffsetY;
  return {
    x: origPos.x - bottomOffsetY * Math.sin(angleRad),
    y: hingeY + bottomOffsetY * Math.cos(angleRad),
    z: origPos.z,
    rotZ: origRot.z + angleRad,
  };
}

/**
 * Computes the vertical position and scaleY of a bedside lamp so it grows upward
 * from its base on top of the nightstand rather than scaling from its centre.
 */
export function computeBasePivotedLampPose(
  origPos: THREE.Vector3,
  origScale: THREE.Vector3,
  bottomOffsetY: number,
  growProgress: number
): { y: number; scaleY: number } {
  const baseSurfaceY = origPos.y - bottomOffsetY;
  return {
    y: baseSurfaceY + bottomOffsetY * growProgress,
    scaleY: origScale.y * growProgress,
  };
}

/**
 * Resets all 9 bed parts to their initial hidden "start" positions before any scroll occurs,
 * sets both warm lamp pointLights to intensity 0, and sets the camera to the hero pose.
 */
export function applyInitialDisassembledState(handle: BedSetHandle): void {
  const {
    parts,
    originalTransforms,
    lampLightLeft,
    lampLightRight,
    cameraPosition,
    cameraTarget,
  } = handle;

  // 1. Base: 0.6 units below its original position
  if (parts.base) {
    const orig = originalTransforms.base;
    parts.base.visible = false;
    parts.base.position.set(orig.position.x, orig.position.y - 0.6, orig.position.z);
    parts.base.rotation.copy(orig.rotation);
    parts.base.scale.copy(orig.scale);
  }

  // 2. Mattress: 1.5 units above its original position
  if (parts.mattress) {
    const orig = originalTransforms.mattress;
    parts.mattress.visible = false;
    parts.mattress.position.set(orig.position.x, orig.position.y + 1.5, orig.position.z);
    parts.mattress.rotation.copy(orig.rotation);
    parts.mattress.scale.copy(orig.scale);
  }

  // 3. Headboard: rotated 90 deg backwards around its bottom edge
  if (parts.headboard) {
    const orig = originalTransforms.headboard;
    const pose = computeHeadboardHingePose(
      orig.position,
      orig.rotation,
      orig.bottomOffsetY,
      Math.PI / 2
    );
    parts.headboard.visible = false;
    parts.headboard.position.set(pose.x, pose.y, pose.z);
    parts.headboard.rotation.set(orig.rotation.x, orig.rotation.y, pose.rotZ);
    parts.headboard.scale.copy(orig.scale);
  }

  // 4. Pillows_Back & Pillows_Front: 0.8 units above their original positions
  if (parts.pillowsBack) {
    const orig = originalTransforms.pillowsBack;
    parts.pillowsBack.visible = false;
    parts.pillowsBack.position.set(orig.position.x, orig.position.y + 0.8, orig.position.z);
    parts.pillowsBack.rotation.copy(orig.rotation);
    parts.pillowsBack.scale.copy(orig.scale);
  }

  if (parts.pillowsFront) {
    const orig = originalTransforms.pillowsFront;
    parts.pillowsFront.visible = false;
    parts.pillowsFront.position.set(orig.position.x, orig.position.y + 0.8, orig.position.z);
    parts.pillowsFront.rotation.copy(orig.rotation);
    parts.pillowsFront.scale.copy(orig.scale);
  }

  // 5. Nightstand_Left (far left along Z) & Nightstand_Right (far right along Z)
  if (parts.nightstandLeft) {
    const orig = originalTransforms.nightstandLeft;
    parts.nightstandLeft.visible = false;
    parts.nightstandLeft.position.set(orig.position.x, orig.position.y, orig.position.z - 1.8);
    parts.nightstandLeft.rotation.copy(orig.rotation);
    parts.nightstandLeft.scale.copy(orig.scale);
  }

  if (parts.nightstandRight) {
    const orig = originalTransforms.nightstandRight;
    parts.nightstandRight.visible = false;
    parts.nightstandRight.position.set(orig.position.x, orig.position.y, orig.position.z + 1.8);
    parts.nightstandRight.rotation.copy(orig.rotation);
    parts.nightstandRight.scale.copy(orig.scale);
  }

  // 6. Lamp_Left & Lamp_Right: scaleY = 0, pivoted at their base on the nightstands
  if (parts.lampLeft) {
    const orig = originalTransforms.lampLeft;
    const pose = computeBasePivotedLampPose(orig.position, orig.scale, orig.bottomOffsetY, 0);
    parts.lampLeft.visible = false;
    parts.lampLeft.position.set(orig.position.x, pose.y, orig.position.z);
    parts.lampLeft.rotation.copy(orig.rotation);
    parts.lampLeft.scale.set(orig.scale.x, pose.scaleY, orig.scale.z);
  }

  if (parts.lampRight) {
    const orig = originalTransforms.lampRight;
    const pose = computeBasePivotedLampPose(orig.position, orig.scale, orig.bottomOffsetY, 0);
    parts.lampRight.visible = false;
    parts.lampRight.position.set(orig.position.x, pose.y, orig.position.z);
    parts.lampRight.rotation.copy(orig.rotation);
    parts.lampRight.scale.set(orig.scale.x, pose.scaleY, orig.scale.z);
  }

  if (lampLightLeft) {
    lampLightLeft.intensity = 0;
  }
  if (lampLightRight) {
    lampLightRight.intensity = 0;
  }

  // 7. Camera initial pose: wide, slightly high establishing shot of the empty studio floor
  if (cameraPosition) {
    cameraPosition.copy(CAMERA_KEYFRAMES.hero.position);
  }
  if (cameraTarget) {
    cameraTarget.copy(CAMERA_KEYFRAMES.hero.target);
  }
  handle.syncCamera?.();
}

/**
 * Synchronises each part's .visible flag based on current timeline time so parts are
 * strictly hidden (visible = false, casting zero shadows) whenever their progress is 0.
 */
export function syncPartVisibilityForTimelineTime(handle: BedSetHandle, time: number): void {
  const { parts } = handle;
  const eps = 0.002;

  if (parts.base) {
    parts.base.visible = time > PART_ACTIVATION_TIMES.base + eps;
  }
  if (parts.mattress) {
    parts.mattress.visible = time > PART_ACTIVATION_TIMES.mattress + eps;
  }
  if (parts.headboard) {
    parts.headboard.visible = time > PART_ACTIVATION_TIMES.headboard + eps;
  }
  if (parts.pillowsBack) {
    parts.pillowsBack.visible = time > PART_ACTIVATION_TIMES.pillowsBack + eps;
  }
  if (parts.pillowsFront) {
    parts.pillowsFront.visible = time > PART_ACTIVATION_TIMES.pillowsFront + eps;
  }
  if (parts.nightstandLeft) {
    parts.nightstandLeft.visible = time > PART_ACTIVATION_TIMES.nightstandLeft + eps;
  }
  if (parts.nightstandRight) {
    parts.nightstandRight.visible = time > PART_ACTIVATION_TIMES.nightstandRight + eps;
  }
  if (parts.lampLeft) {
    parts.lampLeft.visible =
      time > PART_ACTIVATION_TIMES.lampLeft + eps && parts.lampLeft.scale.y > 0.001;
  }
  if (parts.lampRight) {
    parts.lampRight.visible =
      time > PART_ACTIVATION_TIMES.lampRight + eps && parts.lampRight.scale.y > 0.001;
  }
}

export interface UseAssemblyTimelineOptions {
  bedSet: BedSetHandle | null;
  chaptersWrapperRef: RefObject<HTMLElement | null>;
}

/**
 * Builds the single paused master GSAP timeline driven by one ScrollTrigger
 * (trigger = chaptersWrapper, start = "top top", end = "bottom bottom", scrub = 1.2).
 * Animates both the 9 bed parts and the studio camera choreography in lockstep.
 */
export function useAssemblyTimeline({
  bedSet,
  chaptersWrapperRef,
}: UseAssemblyTimelineOptions): void {
  useEffect(() => {
    const wrapper = chaptersWrapperRef.current;
    if (!bedSet || !wrapper) return;

    const {
      parts,
      originalTransforms,
      lampLightLeft,
      lampLightRight,
      cameraPosition,
      cameraTarget,
    } = bedSet;
    const {
      base,
      mattress,
      headboard,
      pillowsBack,
      pillowsFront,
      nightstandLeft,
      nightstandRight,
      lampLeft,
      lampRight,
    } = parts;

    if (
      !base ||
      !mattress ||
      !headboard ||
      !pillowsBack ||
      !pillowsFront ||
      !nightstandLeft ||
      !nightstandRight ||
      !lampLeft ||
      !lampRight
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      // 1. Apply initial disassembled state (all parts hidden at start offsets, hero camera pose)
      applyInitialDisassembledState(bedSet);

      // Animation proxy objects for custom hinged / base-pivoted transforms & 180 deg circular orbit
      const headboardProxy = { angle: Math.PI / 2 };
      const lampsProxy = { progress: 0, lightIntensity: 0 };
      const orbitProxy = { angle: 0 };

      // 2. Create ONE paused master timeline with one ScrollTrigger
      const tl = gsap.timeline({
        paused: true,
        defaults: { immediateRender: false },
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const currentTime = tl.time();
          syncPartVisibilityForTimelineTime(bedSet, currentTime);
          bedSet.syncCamera?.();
          bedSet.invalidate?.();

          if (wrapper) {
            const visibleCount = Object.values(parts).filter(
              (p) => p && p.visible
            ).length;
            wrapper.setAttribute('data-visible-parts', String(visibleCount));
            wrapper.setAttribute('data-timeline-time', currentTime.toFixed(2));
            wrapper.setAttribute(
              'data-camera-pos',
              `${cameraPosition.x.toFixed(2)},${cameraPosition.y.toFixed(2)},${cameraPosition.z.toFixed(2)}`
            );
            wrapper.setAttribute(
              'data-camera-target',
              `${cameraTarget.x.toFixed(2)},${cameraTarget.y.toFixed(2)},${cameraTarget.z.toFixed(2)}`
            );
          }
        },
      });

      // =======================================================================
      // PART ASSEMBLY CHOREOGRAPHY (Step 3 — unchanged)
      // =======================================================================

      // Chapter 1: Hero (0.0 -> 0.25) — Empty studio floor
      tl.addLabel('hero', 0);

      // Chapter 2: Base (0.25 -> 1.0) — Rises from 0.6 units below with soft bounce
      tl.addLabel('base', 0.25);
      tl.fromTo(
        base.position,
        { y: originalTransforms.base.position.y - 0.6 },
        {
          y: originalTransforms.base.position.y,
          duration: 0.75,
          ease: 'back.out(1.4)',
          immediateRender: false,
        },
        'base'
      );

      // Chapter 3: Mattress (1.0 -> 2.0) — Drops from 1.5 above, squashes (scaleY 0.92, scaleX/Z 1.03), settles
      tl.addLabel('mattress', 1.0);
      const mOrigPos = originalTransforms.mattress.position;
      const mOrigScale = originalTransforms.mattress.scale;
      const mBottomOffset = originalTransforms.mattress.bottomOffsetY;

      tl.fromTo(
        mattress.position,
        { y: mOrigPos.y + 1.5 },
        {
          y: mOrigPos.y,
          duration: 0.58,
          ease: 'power2.in',
          immediateRender: false,
        },
        'mattress'
      );

      // Squash on landing (keep bottom flush with base while scaleY compresses to 0.92)
      tl.fromTo(
        mattress.scale,
        {
          x: mOrigScale.x,
          y: mOrigScale.y,
          z: mOrigScale.z,
        },
        {
          x: mOrigScale.x * 1.03,
          y: mOrigScale.y * 0.92,
          z: mOrigScale.z * 1.03,
          duration: 0.16,
          ease: 'power2.out',
          immediateRender: false,
        },
        'mattress+=0.58'
      );
      tl.to(
        mattress.position,
        {
          y: mOrigPos.y - mBottomOffset * 0.08,
          duration: 0.16,
          ease: 'power2.out',
          immediateRender: false,
        },
        'mattress+=0.58'
      );

      // Settle back to original scale and position
      tl.to(
        mattress.scale,
        {
          x: mOrigScale.x,
          y: mOrigScale.y,
          z: mOrigScale.z,
          duration: 0.26,
          ease: 'back.out(2)',
          immediateRender: false,
        },
        'mattress+=0.74'
      );
      tl.to(
        mattress.position,
        {
          y: mOrigPos.y,
          duration: 0.26,
          ease: 'back.out(2)',
          immediateRender: false,
        },
        'mattress+=0.74'
      );

      // Chapter 4: Headboard (2.0 -> 3.0) — Hinges 90° up around its bottom edge
      tl.addLabel('headboard', 2.0);
      const hbOrig = originalTransforms.headboard;
      tl.fromTo(
        headboardProxy,
        { angle: Math.PI / 2 },
        {
          angle: 0,
          duration: 1.0,
          ease: 'power3.out',
          immediateRender: false,
          onUpdate: () => {
            const pose = computeHeadboardHingePose(
              hbOrig.position,
              hbOrig.rotation,
              hbOrig.bottomOffsetY,
              headboardProxy.angle
            );
            headboard.position.set(pose.x, pose.y, pose.z);
            headboard.rotation.set(
              hbOrig.rotation.x,
              hbOrig.rotation.y,
              pose.rotZ
            );
          },
        },
        'headboard'
      );

      // Chapter 5: Pillows (3.0 -> 4.0) — Pillows_Back then Pillows_Front drop from 0.8 above with 0.15 stagger
      tl.addLabel('pillows', 3.0);
      tl.fromTo(
        pillowsBack.position,
        { y: originalTransforms.pillowsBack.position.y + 0.8 },
        {
          y: originalTransforms.pillowsBack.position.y,
          duration: 0.85,
          ease: 'back.out(1.6)',
          immediateRender: false,
        },
        'pillows'
      );
      tl.fromTo(
        pillowsFront.position,
        { y: originalTransforms.pillowsFront.position.y + 0.8 },
        {
          y: originalTransforms.pillowsFront.position.y,
          duration: 0.85,
          ease: 'back.out(1.6)',
          immediateRender: false,
        },
        'pillows+=0.15'
      );

      // Chapter 6: Bedside (4.0 -> 5.0) — Nightstand_Left from far left along Z, Nightstand_Right from far right
      tl.addLabel('bedside', 4.0);
      tl.fromTo(
        nightstandLeft.position,
        { z: originalTransforms.nightstandLeft.position.z - 1.8 },
        {
          z: originalTransforms.nightstandLeft.position.z,
          duration: 1.0,
          ease: 'power3.out',
          immediateRender: false,
        },
        'bedside'
      );
      tl.fromTo(
        nightstandRight.position,
        { z: originalTransforms.nightstandRight.position.z + 1.8 },
        {
          z: originalTransforms.nightstandRight.position.z,
          duration: 1.0,
          ease: 'power3.out',
          immediateRender: false,
        },
        'bedside'
      );

      // Chapter 7: Lighting (5.0 -> 6.0) — Lamps grow up from their base on nightstands, then warm pointLights fade 0 -> 1.2
      tl.addLabel('lighting', 5.0);
      const leftLampOrig = originalTransforms.lampLeft;
      const rightLampOrig = originalTransforms.lampRight;

      tl.fromTo(
        lampsProxy,
        { progress: 0 },
        {
          progress: 1,
          duration: 0.65,
          ease: 'power3.out',
          immediateRender: false,
          onUpdate: () => {
            const leftPose = computeBasePivotedLampPose(
              leftLampOrig.position,
              leftLampOrig.scale,
              leftLampOrig.bottomOffsetY,
              lampsProxy.progress
            );
            lampLeft.position.y = leftPose.y;
            lampLeft.scale.y = leftPose.scaleY;

            const rightPose = computeBasePivotedLampPose(
              rightLampOrig.position,
              rightLampOrig.scale,
              rightLampOrig.bottomOffsetY,
              lampsProxy.progress
            );
            lampRight.position.y = rightPose.y;
            lampRight.scale.y = rightPose.scaleY;
          },
        },
        'lighting'
      );

      tl.fromTo(
        lampsProxy,
        { lightIntensity: 0 },
        {
          lightIntensity: 1.2,
          duration: 0.45,
          ease: 'power2.out',
          immediateRender: false,
          onUpdate: () => {
            if (lampLightLeft) {
              lampLightLeft.intensity = lampsProxy.lightIntensity;
            }
            if (lampLightRight) {
              lampLightRight.intensity = lampsProxy.lightIntensity;
            }
          },
        },
        'lighting+=0.55'
      );

      // Chapter 8: Complete (6.0 -> 7.0)
      tl.addLabel('complete', 6.0);

      // =======================================================================
      // CAMERA CHOREOGRAPHY (Step 4 — all smooth tweens with ease "power2.inOut")
      // =======================================================================

      // 1. hero -> base (0.0 -> 1.0): low angle, closer, looking at base/legs
      tl.fromTo(
        cameraPosition,
        {
          x: CAMERA_KEYFRAMES.hero.position.x,
          y: CAMERA_KEYFRAMES.hero.position.y,
          z: CAMERA_KEYFRAMES.hero.position.z,
        },
        {
          x: CAMERA_KEYFRAMES.base.position.x,
          y: CAMERA_KEYFRAMES.base.position.y,
          z: CAMERA_KEYFRAMES.base.position.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        0
      );
      tl.fromTo(
        cameraTarget,
        {
          x: CAMERA_KEYFRAMES.hero.target.x,
          y: CAMERA_KEYFRAMES.hero.target.y,
          z: CAMERA_KEYFRAMES.hero.target.z,
        },
        {
          x: CAMERA_KEYFRAMES.base.target.x,
          y: CAMERA_KEYFRAMES.base.target.y,
          z: CAMERA_KEYFRAMES.base.target.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        0
      );

      // 2. base -> mattress (1.0 -> 2.0): medium shot from foot-side three-quarter angle, slightly above mattress
      tl.fromTo(
        cameraPosition,
        {
          x: CAMERA_KEYFRAMES.base.position.x,
          y: CAMERA_KEYFRAMES.base.position.y,
          z: CAMERA_KEYFRAMES.base.position.z,
        },
        {
          x: CAMERA_KEYFRAMES.mattress.position.x,
          y: CAMERA_KEYFRAMES.mattress.position.y,
          z: CAMERA_KEYFRAMES.mattress.position.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'mattress'
      );
      tl.fromTo(
        cameraTarget,
        {
          x: CAMERA_KEYFRAMES.base.target.x,
          y: CAMERA_KEYFRAMES.base.target.y,
          z: CAMERA_KEYFRAMES.base.target.z,
        },
        {
          x: CAMERA_KEYFRAMES.mattress.target.x,
          y: CAMERA_KEYFRAMES.mattress.target.y,
          z: CAMERA_KEYFRAMES.mattress.target.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'mattress'
      );

      // 3. mattress -> headboard (2.0 -> 3.0): closer shot towards head end, eye level with headboard
      tl.fromTo(
        cameraPosition,
        {
          x: CAMERA_KEYFRAMES.mattress.position.x,
          y: CAMERA_KEYFRAMES.mattress.position.y,
          z: CAMERA_KEYFRAMES.mattress.position.z,
        },
        {
          x: CAMERA_KEYFRAMES.headboard.position.x,
          y: CAMERA_KEYFRAMES.headboard.position.y,
          z: CAMERA_KEYFRAMES.headboard.position.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'headboard'
      );
      tl.fromTo(
        cameraTarget,
        {
          x: CAMERA_KEYFRAMES.mattress.target.x,
          y: CAMERA_KEYFRAMES.mattress.target.y,
          z: CAMERA_KEYFRAMES.mattress.target.z,
        },
        {
          x: CAMERA_KEYFRAMES.headboard.target.x,
          y: CAMERA_KEYFRAMES.headboard.target.y,
          z: CAMERA_KEYFRAMES.headboard.target.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'headboard'
      );

      // 4. headboard -> pillows (3.0 -> 4.0): close-up over the pillows, gently looking down
      tl.fromTo(
        cameraPosition,
        {
          x: CAMERA_KEYFRAMES.headboard.position.x,
          y: CAMERA_KEYFRAMES.headboard.position.y,
          z: CAMERA_KEYFRAMES.headboard.position.z,
        },
        {
          x: CAMERA_KEYFRAMES.pillows.position.x,
          y: CAMERA_KEYFRAMES.pillows.position.y,
          z: CAMERA_KEYFRAMES.pillows.position.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'pillows'
      );
      tl.fromTo(
        cameraTarget,
        {
          x: CAMERA_KEYFRAMES.headboard.target.x,
          y: CAMERA_KEYFRAMES.headboard.target.y,
          z: CAMERA_KEYFRAMES.headboard.target.z,
        },
        {
          x: CAMERA_KEYFRAMES.pillows.target.x,
          y: CAMERA_KEYFRAMES.pillows.target.y,
          z: CAMERA_KEYFRAMES.pillows.target.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'pillows'
      );

      // 5. pillows -> bedside (4.0 -> 5.0): pull back wide enough to fit both nightstands
      tl.fromTo(
        cameraPosition,
        {
          x: CAMERA_KEYFRAMES.pillows.position.x,
          y: CAMERA_KEYFRAMES.pillows.position.y,
          z: CAMERA_KEYFRAMES.pillows.position.z,
        },
        {
          x: CAMERA_KEYFRAMES.bedside.position.x,
          y: CAMERA_KEYFRAMES.bedside.position.y,
          z: CAMERA_KEYFRAMES.bedside.position.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'bedside'
      );
      tl.fromTo(
        cameraTarget,
        {
          x: CAMERA_KEYFRAMES.pillows.target.x,
          y: CAMERA_KEYFRAMES.pillows.target.y,
          z: CAMERA_KEYFRAMES.pillows.target.z,
        },
        {
          x: CAMERA_KEYFRAMES.bedside.target.x,
          y: CAMERA_KEYFRAMES.bedside.target.y,
          z: CAMERA_KEYFRAMES.bedside.target.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'bedside'
      );

      // 6. bedside -> lighting (5.0 -> 6.0): medium shot including one lamp, warm and intimate
      tl.fromTo(
        cameraPosition,
        {
          x: CAMERA_KEYFRAMES.bedside.position.x,
          y: CAMERA_KEYFRAMES.bedside.position.y,
          z: CAMERA_KEYFRAMES.bedside.position.z,
        },
        {
          x: CAMERA_KEYFRAMES.lighting.position.x,
          y: CAMERA_KEYFRAMES.lighting.position.y,
          z: CAMERA_KEYFRAMES.lighting.position.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'lighting'
      );
      tl.fromTo(
        cameraTarget,
        {
          x: CAMERA_KEYFRAMES.bedside.target.x,
          y: CAMERA_KEYFRAMES.bedside.target.y,
          z: CAMERA_KEYFRAMES.bedside.target.z,
        },
        {
          x: CAMERA_KEYFRAMES.lighting.target.x,
          y: CAMERA_KEYFRAMES.lighting.target.y,
          z: CAMERA_KEYFRAMES.lighting.target.z,
          duration: 1.0,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'lighting'
      );

      // 7. complete (6.0 -> 7.0): smoothly transition from lighting shot to the front three-quarter view
      // (6.0 -> 6.22), then orbit 180° around the bed's centre at constant radius (6.22 -> 7.0)
      tl.fromTo(
        cameraPosition,
        {
          x: CAMERA_KEYFRAMES.lighting.position.x,
          y: CAMERA_KEYFRAMES.lighting.position.y,
          z: CAMERA_KEYFRAMES.lighting.position.z,
        },
        {
          x: CAMERA_KEYFRAMES.completeStart.position.x,
          y: CAMERA_KEYFRAMES.completeStart.position.y,
          z: CAMERA_KEYFRAMES.completeStart.position.z,
          duration: 0.22,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'complete'
      );
      tl.fromTo(
        cameraTarget,
        {
          x: CAMERA_KEYFRAMES.lighting.target.x,
          y: CAMERA_KEYFRAMES.lighting.target.y,
          z: CAMERA_KEYFRAMES.lighting.target.z,
        },
        {
          x: COMPLETE_ORBIT_CENTER.x,
          y: COMPLETE_ORBIT_CENTER.y,
          z: COMPLETE_ORBIT_CENTER.z,
          duration: 0.22,
          ease: 'power2.inOut',
          immediateRender: false,
        },
        'complete'
      );

      tl.fromTo(
        orbitProxy,
        { angle: 0 },
        {
          angle: Math.PI,
          duration: 0.78,
          ease: 'power2.inOut',
          immediateRender: false,
          onUpdate: () => {
            const pos = computeOrbitCameraPosition(orbitProxy.angle);
            cameraPosition.set(pos.x, pos.y, pos.z);
            cameraTarget.copy(COMPLETE_ORBIT_CENTER);
          },
        },
        'complete+=0.22'
      );

      // Ensure visibility and camera match current scroll position on initialization
      syncPartVisibilityForTimelineTime(bedSet, tl.time());
      bedSet.syncCamera?.();
      wrapper.setAttribute('data-visible-parts', '0');
      wrapper.setAttribute('data-timeline-time', '0.00');
      wrapper.setAttribute(
        'data-camera-pos',
        `${cameraPosition.x.toFixed(2)},${cameraPosition.y.toFixed(2)},${cameraPosition.z.toFixed(2)}`
      );
      wrapper.setAttribute(
        'data-camera-target',
        `${cameraTarget.x.toFixed(2)},${cameraTarget.y.toFixed(2)},${cameraTarget.z.toFixed(2)}`
      );
    }, wrapper);

    // Refresh ScrollTrigger once the model and timeline are bound
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, [bedSet, chaptersWrapperRef]);
}
