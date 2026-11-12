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
