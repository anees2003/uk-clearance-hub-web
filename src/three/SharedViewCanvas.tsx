import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  PerspectiveCamera,
  View,
} from '@react-three/drei';
import { gsap, ScrollTrigger } from '../animations/gsap';
import { useTheme } from '../context/ThemeContext';
import { STUDIO_3D_THEME_CONFIG, ThemeMode } from '../data/theme';
import { registerSharedViewMount } from '../utils/studioProgressStore';
import { BedSet } from './BedSet';
import { BED_PART_KEYS, BedPartKey, BedSetHandle } from './bedParts';
import { computeMattressSquashScaleY } from '../data/informativePages';

const INFORMATIVE_ROUTES = new Set([
  '/mattress-guide',
  '/bed-size-guide',
  '/delivery-returns',
  '/about',
  '/faq',
  '/contact',
]);

function isReducedMotionPreferred(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const ViewStudioLighting: React.FC<{
  theme: ThemeMode;
  showFloor?: boolean;
}> = ({ theme, showFloor = true }) => {
  const { scene } = useThree();
  const floorMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const cfg = STUDIO_3D_THEME_CONFIG[theme];

  useEffect(() => {
    const targetColor = new THREE.Color(cfg.viewFloorHex);
    if (!(scene.background instanceof THREE.Color)) {
      scene.background = targetColor.clone();
    }
    const bgCol = scene.background as THREE.Color;

    gsap.to(bgCol, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.6,
      ease: 'power2.out',
    });

    if (floorMatRef.current) {
      gsap.to(floorMatRef.current.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  }, [theme, cfg.viewFloorHex, scene]);

  return (
    <>
      <directionalLight
        color="#FFF8EE"
        intensity={theme === 'dark' ? 1.05 : 0.95}
        position={[3, 5, 2.5]}
      />
      <ambientLight color="#FFFDF9" intensity={theme === 'dark' ? 0.52 : 0.45} />
      <Environment
        preset="studio"
        resolution={64}
        environmentIntensity={0.68}
      >
        <Lightformer
          form="rect"
          intensity={1.9}
          color="#FFF6E8"
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.55}
          color="#FFFDF9"
          position={[[-5, 2, -1][0], [-5, 2, -1][1], [-5, 2, -1][2]]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.55}
          color="#FFFDF9"
          position={[5, 2, -1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
      </Environment>

      {showFloor && (
        <group position={[0, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
            <planeGeometry args={[40, 40]} />
            <meshBasicMaterial
              ref={floorMatRef}
              color={cfg.viewFloorHex}
              toneMapped={false}
            />
          </mesh>
          <ContactShadows
            position={[0, 0.001, 0]}
            opacity={theme === 'dark' ? 0.65 : 0.45}
            blur={2.4}
            far={2.5}
            frames={1}
            resolution={128}
            scale={8}
            color={cfg.contactShadowColor}
          />
        </group>
      )}
    </>
  );
};

function isolateAndCentreNodes(
  handle: BedSetHandle,
  visibleKeys: BedPartKey[],
  initialRotationY = -Math.PI * 0.32
): { baseMinY: number; centerOffset: THREE.Vector3 } {
  const { parts, originalTransforms, bedGroup, lampLightLeft, lampLightRight } =
    handle;
  const visibleSet = new Set<BedPartKey>(visibleKeys);

  for (const key of BED_PART_KEYS) {
    const node = parts[key];
    const orig = originalTransforms[key];
    if (!node || !orig) continue;
    node.position.copy(orig.position);
    node.rotation.copy(orig.rotation);
    node.scale.copy(orig.scale);
    node.visible = visibleSet.has(key);
  }

  if (lampLightLeft) {
    lampLightLeft.intensity = visibleSet.has('lampLeft') ? 1.1 : 0;
  }
  if (lampLightRight) {
    lampLightRight.intensity = visibleSet.has('lampRight') ? 1.1 : 0;
  }

  if (!bedGroup) {
    return { baseMinY: 0, centerOffset: new THREE.Vector3() };
  }

  bedGroup.position.set(0, 0, 0);
  bedGroup.rotation.set(0, initialRotationY, 0);
  bedGroup.updateMatrixWorld(true);

  const box = new THREE.Box3();
  for (const key of visibleKeys) {
    const node = parts[key];
    if (node) {
      box.union(new THREE.Box3().setFromObject(node));
    }
  }

  if (!box.isEmpty()) {
    const center = box.getCenter(new THREE.Vector3());
    bedGroup.position.set(-center.x, -box.min.y, -center.z);
    bedGroup.updateMatrixWorld(true);
    return {
      baseMinY: box.min.y,
      centerOffset: new THREE.Vector3(-center.x, -box.min.y, -center.z),
    };
  }

  return { baseMinY: 0, centerOffset: new THREE.Vector3() };
}

const RotatingMattressRig: React.FC<{ firmness: number; theme: ThemeMode }> = ({
  firmness,
  theme,
}) => {
  const handleRef = useRef<BedSetHandle | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const [ready, setReady] = useState(false);

  const handleReady = (handle: BedSetHandle) => {
    handleRef.current = handle;
    isolateAndCentreNodes(handle, ['mattress'], -Math.PI * 0.28);
    setReady(true);
    window.setTimeout(() => ScrollTrigger.refresh(), 60);
  };

  useEffect(() => {
    if (!ready || !handleRef.current) return;
    const { parts, originalTransforms } = handleRef.current;
    const mattressNode = parts.mattress;
    const orig = originalTransforms.mattress;
    if (!mattressNode || !orig) return;

    const multiplier = computeMattressSquashScaleY(firmness);
    const targetScaleY = orig.scale.y * multiplier;
    const heightDelta = (multiplier - 1) * 0.14;

    gsap.to(mattressNode.scale, {
      y: targetScaleY,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    gsap.to(mattressNode.position, {
      y: orig.position.y + heightDelta,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  }, [firmness, ready]);

  useFrame((_, delta) => {
    if (pivotRef.current && !isReducedMotionPreferred()) {
      pivotRef.current.rotation.y += Math.min(delta, 0.05) * 0.32;
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={28}
        near={0.1}
        far={40}
        position={[0, 1.22, 3.65]}
        onUpdate={(cam) => cam.lookAt(0, 0.18, 0)}
      />
      <ViewStudioLighting theme={theme} showFloor={true} />
      <group ref={pivotRef}>
        <BedSet
          initialAssembled={true}
          disableCameraRig={true}
          onReady={handleReady}
        />
      </group>
    </>
  );
};

const RotatingFullBedRig: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const pivotRef = useRef<THREE.Group | null>(null);

  const handleReady = (handle: BedSetHandle) => {
    isolateAndCentreNodes(handle, [...BED_PART_KEYS], -Math.PI * 0.34);
    window.setTimeout(() => ScrollTrigger.refresh(), 60);
  };

  useFrame((_, delta) => {
    if (pivotRef.current && !isReducedMotionPreferred()) {
      pivotRef.current.rotation.y += Math.min(delta, 0.05) * 0.22;
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={29}
        near={0.1}
        far={50}
        position={[0, 1.58, 5.05]}
        onUpdate={(cam) => cam.lookAt(0, 0.42, 0)}
      />
      <ViewStudioLighting theme={theme} showFloor={true} />
      <group ref={pivotRef}>
        <BedSet
          initialAssembled={true}
          disableCameraRig={true}
          onReady={handleReady}
        />
      </group>
    </>
  );
};

const FloatingPillowsRig: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const floatGroupRef = useRef<THREE.Group | null>(null);

  const handleReady = (handle: BedSetHandle) => {
    isolateAndCentreNodes(
      handle,
      ['pillowsBack', 'pillowsFront'],
      -Math.PI * 0.36
    );
    window.setTimeout(() => ScrollTrigger.refresh(), 60);
  };

  useFrame((state) => {
    if (!floatGroupRef.current || isReducedMotionPreferred()) return;
    const t = state.clock.getElapsedTime();
    floatGroupRef.current.position.y = 0.14 + Math.sin(t * 1.5) * 0.03;
    floatGroupRef.current.rotation.y = Math.sin(t * 0.7) * 0.16;
    floatGroupRef.current.rotation.z = Math.cos(t * 1.1) * 0.02;
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={26}
        near={0.1}
        far={30}
        position={[0, 0.56, 2.65]}
        onUpdate={(cam) => cam.lookAt(0, 0.12, 0)}
      />
      <ViewStudioLighting theme={theme} showFloor={true} />
      <group ref={floatGroupRef}>
        <BedSet
          initialAssembled={true}
          disableCameraRig={true}
          onReady={handleReady}
        />
      </group>
    </>
  );
};

/**
 * 3D Mattress View for /mattress-guide hero (rotates slowly and squashes with firmness 1-10)
 */
export const MattressHeroView: React.FC<{ firmness: number }> = ({
  firmness,
}) => {
  const { theme } = useTheme();
  const currentScaleY = computeMattressSquashScaleY(firmness);

  useEffect(() => {
    return registerSharedViewMount();
  }, []);

  return (
    <div
      data-testid="mattress-hero-3d-view"
      data-firmness={firmness}
      data-scale-y={currentScaleY}
      className="w-full bg-bg-elevated border border-border rounded-xl overflow-hidden shadow-theme"
    >
      <span className="sr-only">
        3D pocket-sprung mattress model demonstrating firmness level {firmness}{' '}
        out of 10 with {Math.round(currentScaleY * 100)}% loft height.
      </span>
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-text font-semibold">
          3D Node · Mattress
        </span>
        <span
          data-testid="mattress-hero-tension-badge"
          className="bg-primary px-2.5 py-0.5 rounded-sm text-[0.6875rem] uppercase tracking-[0.14em] text-white tabular-nums font-medium"
        >
          Tension {firmness}/10 · Loft {Math.round(currentScaleY * 100)}%
        </span>
      </div>

      <View aria-hidden="true" className="w-full aspect-[4/3]">
        <Suspense fallback={null}>
          <RotatingMattressRig firmness={firmness} theme={theme} />
        </Suspense>
      </View>
    </div>
  );
};

/**
 * Full 3D BedSet View for /about hero (static assembled, slowly rotating)
 */
export const AboutFullBedHeroView: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    return registerSharedViewMount();
  }, []);

  return (
    <div
      data-testid="about-hero-3d-view"
      className="w-full bg-bg-elevated border border-border rounded-xl overflow-hidden shadow-theme"
    >
      <span className="sr-only">
        3D turntable preview of the complete 9-part UK Clearance Hub bedroom set.
      </span>
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-text font-semibold">
          3D Showroom · Full 9-Part Suite
        </span>
        <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          Live 360° Turntable
        </span>
      </div>

      <View aria-hidden="true" className="w-full aspect-[4/3]">
        <Suspense fallback={null}>
          <RotatingFullBedRig theme={theme} />
        </Suspense>
      </View>
    </div>
  );
};

/**
 * Floating 3D Pillows_Front + Pillows_Back View for /contact right column
 */
export const ContactPillowsView: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    return registerSharedViewMount();
  }, []);

  return (
    <div
      data-testid="contact-pillows-3d-view"
      className="w-full bg-bg-elevated border border-border rounded-xl overflow-hidden shadow-theme"
    >
      <span className="sr-only">
        3D detail view of the upholstered pillow arrangement from the bedroom set.
      </span>
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-surface border-b border-border">
        <span className="text-[0.625rem] uppercase tracking-[0.16em] text-text font-semibold">
          3D Nodes · Pillows_Front &amp; Pillows_Back
        </span>
        <span className="text-[0.625rem] uppercase tracking-[0.14em] text-muted">
          Showroom Detail
        </span>
      </div>

      <View aria-hidden="true" className="w-full aspect-[16/10]">
        <Suspense fallback={null}>
          <FloatingPillowsRig theme={theme} />
        </Suspense>
      </View>
    </div>
  );
};

/**
 * Live 3D BedSet preview for Slide 3 ("Build your bedroom for less") of the homepage hero carousel
 */
export const HomeHeroBedPreviewView: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    return registerSharedViewMount();
  }, []);

  return (
    <div
      data-testid="home-hero-3d-bed-view"
      className="w-full bg-bg-elevated border border-border-strong rounded-xl overflow-hidden shadow-theme"
    >
      <span className="sr-only">
        Live 3D preview of the 9-part UK Clearance Hub bedroom set.
      </span>
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-text font-semibold">
          3D Bedroom Set · 9-Part Assembly
        </span>
        <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-accent font-semibold">
          Live 360° Preview
        </span>
      </div>

      <View
        aria-hidden="true"
        className="w-full aspect-[16/10] sm:aspect-[16/9]"
      >
        <Suspense fallback={null}>
          <RotatingFullBedRig theme={theme} />
        </Suspense>
      </View>
    </div>
  );
};

/**
 * Single shared WebGL Canvas mounted in Layout when a 3D View is active
 * so switching between /, /mattress-guide, /about, and /contact
 * never creates a new WebGL context.
 */
export const SharedViewCanvas: React.FC = () => {
  const location = useLocation();
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const isViewCanvasRoute =
    location.pathname === '/' || INFORMATIVE_ROUTES.has(location.pathname);

  if (!isViewCanvasRoute) {
    return null;
  }

  return (
    <Canvas
      aria-hidden="true"
      data-testid="shared-drei-view-canvas"
      frameloop={isTabVisible ? 'always' : 'never'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      eventSource={
        typeof document !== 'undefined'
          ? (document.getElementById('root') ?? document.body)
          : undefined
      }
    >
      <View.Port />
    </Canvas>
  );
};

