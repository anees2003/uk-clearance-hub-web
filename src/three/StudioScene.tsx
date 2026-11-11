import React, {
  Suspense,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
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
import { BedSet } from './BedSet';
import { BedSetHandle } from './bedParts';

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

export interface StudioLoadingProgress {
  active: boolean;
  progress: number;
  loaded: number;
  total: number;
  item: string;
}

/**
 * Re-export hook for Step 5 preloader and scene progress subscribers.
 */
export function useStudioProgress(): StudioLoadingProgress {
  const { active, progress, loaded, total, item } = useProgress();
  return { active, progress, loaded, total, item };
}

export interface StudioSceneProps {
  /** Enable temporary OrbitControls for inspecting the 3D scene */
  enableOrbitControls?: boolean;
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

const StudioLightingAndEnvironment: React.FC = () => {
  return (
    <>
      {/* Warm-white key directional light casting soft studio shadows */}
      <directionalLight
        color="#FFF8EE"
        intensity={0.85}
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

      {/* Studio IBL Environment with Lightformer softboxes */}
      <Environment
        preset="studio"
        resolution={256}
        environmentIntensity={0.6}
      >
        {/* 1. Large warm rectangle softbox above (intensity ~2) */}
        <Lightformer
          form="rect"
          intensity={2.0}
          color="#FFF6E8"
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
        />
        {/* 2. Thin vertical strip on the left for rim highlights */}
        <Lightformer
          form="rect"
          intensity={1.35}
          color="#FFFDF9"
          position={[-5, 2, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
        {/* 3. Thin vertical strip on the right for rim highlights */}
        <Lightformer
          form="rect"
          intensity={1.35}
          color="#FFFDF9"
          position={[5, 2, -1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1.1, 5, 1]}
        />
        {/* 4. Soft fill in front */}
        <Lightformer
          form="rect"
          intensity={0.85}
          color="#FFFDF8"
          position={[0, 1.8, 6]}
          rotation={[0, Math.PI, 0]}
          scale={[6, 3, 1]}
        />
      </Environment>
    </>
  );
};

const StudioFloor: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Seamless ivory studio cyclorama floor matching #F3EFE9 background and fog */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.003, 0]}
      >
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial color="#F3EFE9" toneMapped={false} />
      </mesh>

      {/* Directional shadow catcher layer */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <shadowMaterial transparent opacity={0.16} color="#26211C" />
      </mesh>

      {/* Real-time dynamic ContactShadows updating as parts assemble */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.6}
        blur={2.5}
        far={3}
        resolution={isSoftwareGl ? 128 : 1024}
        scale={12}
        color="#2B2520"
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

const StudioPostprocessing: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
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
    if (!pass.__patchedHalfRes && typeof pass.configureHalfResTargets === 'function') {
      const orig = pass.configureHalfResTargets.bind(pass);
      pass.configureHalfResTargets = function () {
        orig();
        patchTarget(this.depthDownsampleTarget);
      };
      pass.__patchedHalfRes = true;
    }
  }, []);

  return (
    <EffectComposer multisampling={0}>
      <N8AO
        ref={handleN8AORef}
        aoRadius={0.5}
        intensity={1.5}
        halfRes={isMobile || isSoftwareGl}
      />
      <Bloom
        intensity={0.15}
        luminanceThreshold={0.9}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
      <Vignette offset={0.35} darkness={0.25} />
    </EffectComposer>
  );
};

const CornerLoadingIndicator: React.FC = () => {
  const { progress, active } = useStudioProgress();
  const displayPercent = Math.min(100, Math.round(progress || (active ? 0 : 100)));

  return (
    <div
      data-testid="studio-loading-indicator"
      data-loaded={!active && displayPercent === 100 ? 'true' : 'false'}
      className="pointer-events-none fixed bottom-6 right-6 z-30 flex items-center gap-2.5 border border-[rgba(28,28,30,0.12)] bg-[#F3EFE9] px-3.5 py-2 text-xs text-[#1C1C1E] font-mono tabular-nums"
    >
      <span className="uppercase tracking-[0.16em] text-[0.6875rem] text-[#8A8580] font-sans">
        Studio 3D
      </span>
      <span className="text-[#1C1C1E]/30" aria-hidden="true">
        ·
      </span>
      <span aria-live="polite">{displayPercent}%</span>
    </div>
  );
};

export const StudioScene = forwardRef<BedSetHandle, StudioSceneProps>(
  (
    {
      enableOrbitControls = false,
      showCornerProgress = false,
      initialAssembled = true,
      onBedSetReady,
      onProgressChange,
      className = 'w-full h-full',
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile, { passive: true });
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
      <div
        data-testid="studio-scene-container"
        data-mobile-camera={isMobile ? 'true' : 'false'}
        className={`relative bg-[#F3EFE9] ${className}`.trim()}
      >
        <ProgressBridge onProgressChange={onProgressChange} />
        {showCornerProgress && <CornerLoadingIndicator />}

        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          frameloop={isSoftwareGl ? 'demand' : 'always'}
          dpr={isSoftwareGl ? 1 : [1, 2]}
          style={{ pointerEvents: enableOrbitControls ? 'auto' : 'none' }}
          gl={{
            antialias: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: 'high-performance',
          }}
        >
          <color attach="background" args={['#F3EFE9']} />
          <fog attach="fog" args={['#F3EFE9', 10, 26]} />

          {/* PerspectiveCamera (fov 30) driven by BedSet useFrame + GSAP master timeline */}
          <PerspectiveCamera
            makeDefault
            fov={30}
            near={0.1}
            far={100}
          />

          <Suspense fallback={null}>
            <StudioLightingAndEnvironment />
            <BedSet
              ref={ref}
              initialAssembled={initialAssembled}
              onReady={onBedSetReady}
            />
            <StudioFloor />
            <StudioPostprocessing isMobile={isMobile} />
            <InvalidateOnLoad />
          </Suspense>

          {enableOrbitControls && (
            <OrbitControls
              target={[0, 0.36, 0]}
              enableDamping={!isSoftwareGl}
              dampingFactor={0.05}
              minPolarAngle={Math.PI * 0.12}
              maxPolarAngle={Math.PI * 0.48}
              minDistance={2.5}
              maxDistance={9.5}
            />
          )}
        </Canvas>
      </div>
    );
  }
);

StudioScene.displayName = 'StudioScene';
