import React, { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerspectiveCamera } from '@react-three/drei';
import { useTheme } from '../context/ThemeContext';
import { STUDIO_3D_THEME_CONFIG, ThemeMode } from '../data/theme';
import { BedSet } from './BedSet';
import { BedSetHandle } from './bedParts';
import {
  CATEGORY_CAMERA_FRAMING,
  applyCategoryIsolationAndCentring,
  tweenBedSetMaterialColour,
  tweenBedSetWidthScale,
} from './productModelUtils';
import { THREE_D_DEALS, Deal } from '../data/deals';

// Module-level cache of rendered 3D studio snapshots keyed by `${theme}:${deal.id}`
const snapshotCache = new Map<string, string>();
const listeners = new Set<() => void>();
const capturedThemes = new Set<ThemeMode>();

function notifySnapshotListeners() {
  listeners.forEach((fn) => fn());
}

export function getCachedProductSnapshot(
  productId: string,
  theme: ThemeMode = 'dark'
): string | undefined {
  return snapshotCache.get(`${theme}:${productId}`);
}

export function useProduct3DSnapshot(deal: Pick<Deal, 'id' | 'threeDConfig'>): string | undefined {
  const { theme } = useTheme();
  const [url, setUrl] = useState<string | undefined>(() =>
    deal.threeDConfig ? snapshotCache.get(`${theme}:${deal.id}`) : undefined
  );

  useEffect(() => {
    if (!deal.threeDConfig) {
      setUrl(undefined);
      return;
    }
    const sync = () => {
      const next = snapshotCache.get(`${theme}:${deal.id}`);
      setUrl(next);
    };
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, [deal.id, deal.threeDConfig, theme]);

  return url;
}

const SnapshotCaptureRig: React.FC<{
  theme: ThemeMode;
  onAllCaptured: () => void;
}> = ({ theme, onAllCaptured }) => {
  const { gl, scene, camera } = useThree();
  const hasCapturedRef = useRef<ThemeMode | null>(null);
  const cfg = STUDIO_3D_THEME_CONFIG[theme];

  const handleBedSetReady = (handle: BedSetHandle) => {
    if (hasCapturedRef.current === theme) return;
    hasCapturedRef.current = theme;

    window.setTimeout(() => {
      try {
        scene.background = new THREE.Color(cfg.viewFloorHex);

        THREE_D_DEALS.forEach((deal, idx) => {
          const threeD = deal.threeDConfig;
          if (!threeD) return;
          const cacheKey = `${theme}:${deal.id}`;
          if (snapshotCache.has(cacheKey)) return;

          const framing = CATEGORY_CAMERA_FRAMING[threeD.modelCategory];
          const angleDelta = CAPTURE_ANGLES[idx % CAPTURE_ANGLES.length];
          applyCategoryIsolationAndCentring(
            handle,
            threeD.modelCategory,
            framing.rotationY + angleDelta
          );

          tweenBedSetWidthScale(handle, 1.0, true);
          const primaryHex = threeD.colours[0]?.hex ?? '#D8CFC2';
          tweenBedSetMaterialColour(handle, threeD.modelCategory, primaryHex, true);

          camera.position.set(
            framing.cameraPosition[0],
            framing.cameraPosition[1],
            framing.cameraPosition[2] * 0.92
          );
          camera.lookAt(
            framing.orbitTarget[0],
            framing.orbitTarget[1],
            framing.orbitTarget[2]
          );
          camera.updateMatrixWorld(true);

          gl.render(scene, camera);
          const dataUrl = gl.domElement.toDataURL('image/webp', 0.88);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            snapshotCache.set(cacheKey, dataUrl);
          }
        });

        capturedThemes.add(theme);
        notifySnapshotListeners();
        onAllCaptured();
      } catch (err) {
        console.warn('[SharedProductPreviewCanvas] Snapshot capture fallback:', err);
        capturedThemes.add(theme);
        onAllCaptured();
      }
    }, 120);
  };

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
        resolution={128}
        environmentIntensity={theme === 'dark' ? 0.72 : 0.65}
      >
        <Lightformer
          form="rect"
          intensity={cfg.topSoftboxIntensity}
          color="#FFF6E8"
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={cfg.rimLightIntensity}
          color="#FFFDF9"
          position={[-5, 2, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={cfg.rimLightIntensity}
          color="#FFFDF9"
          position={[5, 2, -1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
      </Environment>

      {/* Studio floor matching active theme */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color={cfg.viewFloorHex} toneMapped={false} />
      </mesh>

      <BedSet
        key={theme}
        initialAssembled={true}
        disableCameraRig={true}
        onReady={handleBedSetReady}
      />
    </>
  );
};

const CAPTURE_ANGLES: number[] = [-0.22, 0.08, 0.26, -0.12];

/**
 * Mounts a single shared 3D renderer that generates static studio renders of all 16 products
 * for the active theme and then unmounts so zero extra WebGL contexts remain active.
 */
export const SharedProductPreviewRenderer: React.FC = () => {
  const { theme } = useTheme();
  const [done, setDone] = useState<boolean>(() => capturedThemes.has(theme));
  const cfg = STUDIO_3D_THEME_CONFIG[theme];

  useEffect(() => {
    setDone(capturedThemes.has(theme));
  }, [theme]);

  if (done) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-testid="shared-product-preview-renderer"
      className="fixed -left-[9999px] top-0 w-[480px] h-[360px] pointer-events-none opacity-0 overflow-hidden"
    >
      <Canvas
        frameloop="demand"
        dpr={1}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <color attach="background" args={[cfg.viewFloorHex]} />
        <PerspectiveCamera makeDefault fov={30} near={0.1} far={50} />
        <Suspense fallback={null}>
          <SnapshotCaptureRig
            theme={theme}
            onAllCaptured={() => setDone(true)}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
