import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress upstream @react-three/fiber internal THREE.Clock deprecation warning in Three r183+
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('THREE.Clock: This module has been deprecated')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(<App />);

