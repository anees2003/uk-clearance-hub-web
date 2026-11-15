import { useEffect, useState } from 'react';

export interface StudioLoadingProgress {
  active: boolean;
  progress: number;
  loaded: number;
  total: number;
  item: string;
}

const INITIAL_PROGRESS: StudioLoadingProgress = {
  active: false,
  progress: 0,
  loaded: 0,
  total: 0,
  item: '',
};

let currentProgress: StudioLoadingProgress = INITIAL_PROGRESS;
const listeners = new Set<(state: StudioLoadingProgress) => void>();

let activeViewMountCount = 0;
const viewMountListeners = new Set<(mounted: boolean) => void>();

export function publishStudioProgress(next: StudioLoadingProgress): void {
  currentProgress = next;
  listeners.forEach((listener) => listener(currentProgress));
}

export function getStudioProgressSnapshot(): StudioLoadingProgress {
  return currentProgress;
}

export function useStudioProgressSubscription(): StudioLoadingProgress {
  const [state, setState] = useState<StudioLoadingProgress>(currentProgress);

  useEffect(() => {
    setState(currentProgress);
    const handler = (next: StudioLoadingProgress) => {
      setState(next);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return state;
}

/** The preloader never waits longer than this for the 3D model (a stalled download). */
export const STUDIO_PRELOADER_MAX_WAIT_MS = 10000;

/**
 * True when the preloader may stop waiting for the 3D model: loading finished,
 * the 3D layer failed, or the maximum wait has passed.
 */
export function isStudioLoadSettled(
  { active, progress, loaded, total }: StudioLoadingProgress,
  { failed, maxWaitPassed }: { failed: boolean; maxWaitPassed: boolean }
): boolean {
  if (failed || maxWaitPassed) return true;
  return !active && (progress >= 100 || (total > 0 && loaded >= total));
}

// Shared "3D failed" signal: set once by any 3D error boundary, read by every
// 3D slot (so it shows the "3D view unavailable" panel) and by the Preloader.
let studioFailed = false;
const failureListeners = new Set<(failed: boolean) => void>();

export function markStudioFailed(): void {
  if (studioFailed) return;
  studioFailed = true;
  failureListeners.forEach((listener) => listener(true));
}

export function isStudioFailed(): boolean {
  return studioFailed;
}

export function subscribeStudioFailure(listener: (failed: boolean) => void): () => void {
  failureListeners.add(listener);
  return () => {
    failureListeners.delete(listener);
  };
}

export function useStudioFailed(): boolean {
  const [failed, setFailed] = useState<boolean>(studioFailed);
  useEffect(() => {
    setFailed(studioFailed);
    return subscribeStudioFailure(setFailed);
  }, []);
  return failed;
}

export function registerSharedViewMount(): () => void {
  activeViewMountCount += 1;
  viewMountListeners.forEach((fn) => fn(activeViewMountCount > 0));
  return () => {
    activeViewMountCount = Math.max(0, activeViewMountCount - 1);
    viewMountListeners.forEach((fn) => fn(activeViewMountCount > 0));
  };
}

export function useHasMountedSharedView(): boolean {
  const [mounted, setMounted] = useState<boolean>(activeViewMountCount > 0);

  useEffect(() => {
    setMounted(activeViewMountCount > 0);
    const handler = (hasActive: boolean) => setMounted(hasActive);
    viewMountListeners.add(handler);
    return () => {
      viewMountListeners.delete(handler);
    };
  }, []);

  return mounted;
}
