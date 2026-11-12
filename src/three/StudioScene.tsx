import React, {
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
  PerspectiveCamera,
  useProgress,
} from '@react-three/drei';
import {
  Bloom,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { gsap } from '../animations/gsap';
import { useTheme } from '../context/ThemeContext';
import { STUDIO_3D_THEME_CONFIG, ThemeMode } from '../data/theme';
import {
  StudioLoadingProgress,
  publishStudioProgress,
} from '../utils/studioProgressStore';
import { BedSet } from './BedSet';
import { BedSetHandle } from './bedParts';

export type { StudioLoadingProgress };

// Redirect Drei's raw.githack.com preset asset URL to jsDelivr CDN so preset="studio"
// loads reliably with HTTP 200 across all environments.
THREE.DefaultLoadingManager.setURLModifier((url) => {
  if (url.startsWith('https://raw.githack.com/pmndrs/drei-assets/')) {
    return url.replace(
      'https://raw.githack.com/pmndrs/drei-assets/',
      'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@'
    );
  }
  return url;
});

const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
})();

const isLowPowerDevice = (() => {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency || 4;
  return cores <= 4;
})();

/**
 * Re-export hook for Step 5 preloader and scene progress subscribers.
 */
export function useStudioProgress(): StudioLoadingProgress {
  const { active, progress, loaded, total, item } = useProgress();
  return { active, progress, loaded, total, item };
}

export interface StudioSceneProps {
  /** Enable OrbitControls for inspecting the 3D scene */
  enableOrbitControls?: boolean;
  /** Automatically rotate OrbitControls until user interacts */
  autoRotate?: boolean;
  /** Speed of OrbitControls auto-rotation */
  autoRotateSpeed?: number;
  /** Callback fired when the user begins interacting with OrbitControls */
  onOrbitStart?: () => void;
  /** Initial camera position when OrbitControls is active */
  cameraInitialPosition?: [number, number, number];
  /** Target point for OrbitControls */
  orbitTarget?: [number, number, number];
  /** Minimum zoom distance for OrbitControls */
  minDistance?: number;
  /** Maximum zoom distance for OrbitControls */
  maxDistance?: number;
  /** Show subtle loading percentage indicator in the corner */
  showCornerProgress?: boolean;
  /** Whether parts start assembled (true) or hidden for scroll assembly (false) */
  initialAssembled?: boolean;
  /** Callback fired once the BedSet model and parts are ready */
  onBedSetReady?: (handle: BedSetHandle) => void;
  /** Optional callback fired when loading progress updates */
  onProgressChange?: (state: StudioLoadingProgress) => void;
  /** Optional className for the outer wrapper */
  className?: string;
}

const ProgressBridge: React.FC<{
  onProgressChange?: (state: StudioLoadingProgress) => void;
}> = ({ onProgressChange }) => {
  const progressState = useStudioProgress();

  useEffect(() => {
    publishStudioProgress(progressState);
    onProgressChange?.(progressState);
  }, [
    onProgressChange,
    progressState.active,
    progressState.progress,
    progressState.loaded,
    progressState.total,
    progressState.item,
  ]);

  return null;
};

const StudioLightingAndEnvironment: React.FC<{ theme: ThemeMode }> = ({
  theme,
}) => {
  const { scene, invalidate } = useThree();
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimBlueRef = useRef<THREE.PointLight | null>(null);
  const rimWarmRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    const targetKeyIntensity = theme === 'dark' ? 0.98 : 0.85;
    const targetEnvIntensity = theme === 'dark' ? 0.72 : 0.6;
    const targetRimBlue = theme === 'dark' ? 0.42 : 0.14;
    const targetRimWarm = theme === 'dark' ? 0.24 : 0.1;

    if (isSoftwareGl) {
      if (keyLightRef.current) keyLightRef.current.intensity = targetKeyIntensity;
      if (rimBlueRef.current) rimBlueRef.current.intensity = targetRimBlue;
      if (rimWarmRef.current) rimWarmRef.current.intensity = targetRimWarm;
      scene.environmentIntensity = targetEnvIntensity;
      invalidate();
      return;
    }

    const tl = gsap.timeline({
      defaults: { duration: 0.6, ease: 'power2.out' },
    });

    if (keyLightRef.current) {
      tl.to(keyLightRef.current, { intensity: targetKeyIntensity }, 0);
    }
    if (rimBlueRef.current) {
      tl.to(rimBlueRef.current, { intensity: targetRimBlue }, 0);
    }
    if (rimWarmRef.current) {
      tl.to(rimWarmRef.current, { intensity: targetRimWarm }, 0);
    }
    tl.to(scene, { environmentIntensity: targetEnvIntensity }, 0);

    return () => {
      tl.kill();
    };
  }, [theme, scene, invalidate]);

  return (
    <>
      {/* Warm-white key directional light casting soft studio shadows */}
      <directionalLight
        ref={keyLightRef}
        color="#FFF8EE"
        intensity={0.98}
        position={[3, 5, 2.5]}
        castShadow
        shadow-mapSize={isSoftwareGl ? [512, 512] : [2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
        shadow-camera-left={-2.8}
        shadow-camera-right={2.8}
        shadow-camera-top={2.8}
        shadow-camera-bottom={-2.8}
      />

      {/* Subtle rim accent lights that intensify in dark studio mode */}
      <pointLight
        ref={rimBlueRef}
        color="#16A5F4"
        intensity={0.42}
        distance={12}
        decay={2}
        position={[-3.8, 2.2, -2.2]}
      />
      <pointLight
        ref={rimWarmRef}
        color="#FD7209"
        intensity={0.24}
        distance={12}
        decay={2}
        position={[3.8, 1.9, -2.0]}
      />

      {/* Static Studio IBL Environment with 4 Lightformer softboxes (baked once) */}
      <Environment
        preset="studio"
        resolution={isSoftwareGl ? 64 : 256}
        environmentIntensity={0.68}
      >
        {/* 1. Large warm rectangle softbox above */}
        <Lightformer
          form="rect"
          intensity={1.9}
          color="#FFF6E8"
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
        />
        {/* 2. Thin vertical strip on the left for rim highlights */}
        <Lightformer
          form="rect"
          intensity={1.55}
          color="#FFFDF9"
          position={[-5, 2, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
        {/* 3. Thin vertical strip on the right for rim highlights */}
        <Lightformer
          form="rect"
          intensity={1.55}
          color="#FFFDF9"
          position={[5, 2, -1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
        {/* 4. Soft fill in front */}
        <Lightformer
          form="rect"
          intensity={0.95}
          color="#FFFDF8"
          position={[0, 1.8, 6]}
          rotation={[0, Math.PI, 0]}
          scale={[6, 3, 1]}
        />
      </Environment>
    </>
  );
};

const StudioAtmosphereAndFloor: React.FC<{ theme: ThemeMode }> = ({
  theme,
}) => {
  const { scene, invalidate } = useThree();
  const floorMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const shadowMatRef = useRef<THREE.ShadowMaterial | null>(null);
  const initialConfig = STUDIO_3D_THEME_CONFIG[theme];

  useEffect(() => {
    const targetCfg = STUDIO_3D_THEME_CONFIG[theme];
    const targetBg = new THREE.Color(targetCfg.backgroundHex);
    const targetFog = new THREE.Color(targetCfg.fogHex);
    const targetFloor = new THREE.Color(targetCfg.floorHex);
    const targetShadowCol = new THREE.Color(targetCfg.shadowMaterialColor);

    if (!(scene.background instanceof THREE.Color)) {
      scene.background = targetBg.clone();
    }
    if (!scene.fog) {
      scene.fog = new THREE.Fog(targetCfg.fogHex, 10, 26);
    }

    const bgCol = scene.background as THREE.Color;
    const fogCol = scene.fog.color;

    if (isSoftwareGl) {
      bgCol.copy(targetBg);
      fogCol.copy(targetFog);
      if (floorMatRef.current) {
        floorMatRef.current.color.copy(targetFloor);
      }
      if (shadowMatRef.current) {
        shadowMatRef.current.opacity = targetCfg.shadowMaterialOpacity;
        shadowMatRef.current.color.copy(targetShadowCol);
      }
      invalidate();
      return;
    }

    const tl = gsap.timeline({
      defaults: { duration: 0.6, ease: 'power2.out' },
      onUpdate: () => invalidate(),
    });

    tl.to(
      bgCol,
      { r: targetBg.r, g: targetBg.g, b: targetBg.b },
      0
    );
    tl.to(
      fogCol,
      { r: targetFog.r, g: targetFog.g, b: targetFog.b },
      0
    );

    if (floorMatRef.current) {
      tl.to(
        floorMatRef.current.color,
        { r: targetFloor.r, g: targetFloor.g, b: targetFloor.b },
        0
      );
    }

    if (shadowMatRef.current) {
      tl.to(
        shadowMatRef.current,
        { opacity: targetCfg.shadowMaterialOpacity },
        0
      );
      tl.to(
        shadowMatRef.current.color,
        { r: targetShadowCol.r, g: targetShadowCol.g, b: targetShadowCol.b },
        0
      );
    }

    return () => {
      tl.kill();
    };
  }, [theme, scene, invalidate]);

  return (
    <group position={[0, 0, 0]}>
      {/* Seamless studio cyclorama floor animated smoothly on theme switch */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.003, 0]}
      >
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial
          ref={floorMatRef}
          color={initialConfig.floorHex}
          toneMapped={false}
        />
      </mesh>

      {/* Directional shadow catcher layer */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <shadowMaterial
          ref={shadowMatRef}
          transparent
          opacity={initialConfig.shadowMaterialOpacity}
          color={initialConfig.shadowMaterialColor}
        />
      </mesh>

      {/* Real-time dynamic ContactShadows updating as parts assemble */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.64}
        blur={2.5}
        far={3}
        frames={isSoftwareGl ? 1 : Infinity}
        resolution={isSoftwareGl ? 128 : 1024}
        scale={12}
        color="#030712"
      />
    </group>
  );
};

const InvalidateOnLoad: React.FC = () => {
  const invalidate = useThree((state) => state.invalidate);
  const { active, loaded } = useProgress();

  useEffect(() => {
    invalidate();
    const timers = [
      window.setTimeout(() => invalidate(), 100),
      window.setTimeout(() => invalidate(), 350),
      window.setTimeout(() => invalidate(), 700),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [invalidate, active, loaded]);

  return null;
};

const StudioPostprocessing: React.FC<{
  isMobile: boolean;
  lowPerfMode: boolean;
}> = React.memo(({ isMobile, lowPerfMode }) => {
  // Ensure N8AO's internal halfRes MRT target exposes .texture as textures[0]
  // for Three.js r170+ WebGLTextures.setupRenderTarget compatibility.
  const handleN8AORef = useCallback((pass: any) => {
    if (!pass) return;
    const patchTarget = (target: any) => {
      if (!target) return;
      Object.defineProperty(target, 'texture', {
        get() {
          return this.textures?.[0];
        },
        configurable: true,
      });
    };
    patchTarget(pass.depthDownsampleTarget);
    if (
      !pass.__patchedHalfRes &&
      typeof pass.configureHalfResTargets === 'function'
    ) {
      const orig = pass.configureHalfResTargets.bind(pass);
      pass.configureHalfResTargets = function () {
        orig();
        patchTarget(this.depthDownsampleTarget);
      };
      pass.__patchedHalfRes = true;
    }
  }, []);

  if (lowPerfMode) {
    return (
      <EffectComposer multisampling={0}>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.35} darkness={0.3} />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <N8AO
        ref={handleN8AORef}
        aoRadius={0.5}
        intensity={1.5}
        halfRes={isMobile || isSoftwareGl || isLowPowerDevice}
      />
      <Bloom intensity={0.2} luminanceThreshold={0.9} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
      <Vignette offset={0.35} darkness={0.3} />
    </EffectComposer>
  );
});
StudioPostprocessing.displayName = 'StudioPostprocessing';

const CornerLoadingIndicator: React.FC = () => {
  const { progress, active } = useStudioProgress();
  const displayPercent = Math.min(100, Math.round(progress || (active ? 0 : 100)));

  return (
    <div
      data-testid="studio-loading-indicator"
      data-loaded={!active && displayPercent === 100 ? 'true' : 'false'}
      className="pointer-events-none fixed bottom-6 right-6 z-30 flex items-center gap-2.5 border border-border bg-surface px-3.5 py-2 text-xs text-text font-mono tabular-nums rounded-lg shadow-theme"
    >
      <span className="uppercase tracking-[0.16em] text-[0.6875rem] text-muted font-sans">
        Studio 3D
      </span>
      <span className="text-muted/40" aria-hidden="true">
        ·
      </span>
      <span aria-live="polite">{displayPercent}%</span>
    </div>
  );
};

const CANVAS_SHADOWS_CONFIG = { type: THREE.PCFShadowMap };
const CANVAS_GL_CONFIG = {
  antialias: false,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  outputColorSpace: THREE.SRGBColorSpace,
  powerPreference: 'high-performance' as const,
};
const DESKTOP_DPR: [number, number] = [1, 2];
const MOBILE_DPR: [number, number] = [1, 1.5];

export const StudioScene = forwardRef<BedSetHandle, StudioSceneProps>(
  (
    {
      enableOrbitControls = false,
      autoRotate = false,
      autoRotateSpeed = 0.65,
      onOrbitStart,
      cameraInitialPosition = [0, 1.5, 5.1],
      orbitTarget = [0, 0.36, 0],
      minDistance = 2.4,
      maxDistance = 8.5,
      showCornerProgress = false,
      initialAssembled = true,
      onBedSetReady,
      onProgressChange,
      className = 'w-full h-full',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [lowPerfMode, setLowPerfMode] = useState(false);
    const [isTabVisible, setIsTabVisible] = useState(true);
    const [isInViewport, setIsInViewport] = useState(true);
    const [reducedMotion, setReducedMotion] = useState(false);
    const { theme } = useTheme();
    const studioCfg = STUDIO_3D_THEME_CONFIG[theme];

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile, { passive: true });

      const mq =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-reduced-motion: reduce)')
          : null;
      if (mq) {
        setReducedMotion(mq.matches);
      }

      const handleVisibilityChange = () => {
        setIsTabVisible(document.visibilityState !== 'hidden');
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      let observer: IntersectionObserver | null = null;
      if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry) {
              setIsInViewport(entry.isIntersecting);
            }
          },
          { threshold: 0.01 }
        );
        observer.observe(containerRef.current);
      }

      return () => {
        window.removeEventListener('resize', checkMobile);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        observer?.disconnect();
      };
    }, []);

    const activeDpr: number | [number, number] = isSoftwareGl
      ? 1
      : isMobile || isLowPowerDevice || lowPerfMode
      ? MOBILE_DPR
      : DESKTOP_DPR;

    const activeFrameloop: 'always' | 'demand' | 'never' =
      !isTabVisible || !isInViewport
        ? 'never'
        : isSoftwareGl
        ? 'demand'
        : 'always';

    return (
      <div
        ref={containerRef}
        data-testid="studio-scene-container"
        data-studio-theme={theme}
        data-studio-floor={studioCfg.floorHex}
        data-mobile-camera={isMobile ? 'true' : 'false'}
        className={`relative bg-bg transition-colors duration-500 ${className}`.trim()}
      >
        <span className="sr-only">
          3D bedroom furniture showroom model featuring an upholstered bed base,
          pocket-sprung mattress, winged headboard, pillows, bedside tables, and
          warm bedside lamps.
        </span>
        <ProgressBridge onProgressChange={onProgressChange} />
        {showCornerProgress && <CornerLoadingIndicator />}

        <Canvas
          aria-hidden="true"
          shadows={CANVAS_SHADOWS_CONFIG}
          frameloop={activeFrameloop}
          dpr={activeDpr}
          style={{ pointerEvents: enableOrbitControls ? 'auto' : 'none' }}
          gl={CANVAS_GL_CONFIG}
        >
          <PerformanceMonitor
            flipflops={2}
            onDecline={() => setLowPerfMode(true)}
            onFallback={() => setLowPerfMode(true)}
          />

          <PerspectiveCamera
            makeDefault
            fov={30}
            near={0.1}
            far={100}
            position={enableOrbitControls ? cameraInitialPosition : undefined}
          />

          <Suspense fallback={null}>
            <StudioLightingAndEnvironment theme={theme} />
            <BedSet
              ref={ref}
              initialAssembled={initialAssembled}
              disableCameraRig={enableOrbitControls}
              onReady={onBedSetReady}
            />
            <StudioAtmosphereAndFloor theme={theme} />
            <StudioPostprocessing
              isMobile={isMobile}
              lowPerfMode={lowPerfMode}
            />
            <InvalidateOnLoad />
          </Suspense>

          {enableOrbitControls && (
            <OrbitControls
              makeDefault
              target={orbitTarget}
              enablePan={false}
              enableDamping={!isSoftwareGl}
              dampingFactor={0.05}
              autoRotate={autoRotate && !isSoftwareGl && !reducedMotion}
              autoRotateSpeed={autoRotateSpeed}
              minPolarAngle={Math.PI * 0.12}
              maxPolarAngle={Math.PI * 0.48}
              minDistance={minDistance}
              maxDistance={maxDistance}
              onStart={onOrbitStart}
            />
          )}
        </Canvas>
      </div>
    );
  }
);

StudioScene.displayName = 'StudioScene';
