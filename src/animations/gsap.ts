import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

let isRegistered = false;

export function registerGsapPlugins(): void {
  if (!isRegistered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, Flip);
    isRegistered = true;
  }
}

registerGsapPlugins();

export { gsap, ScrollTrigger, Flip };
