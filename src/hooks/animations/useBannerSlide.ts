import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';

export function useBannerSlide<T extends HTMLElement>(ref: RefObject<T>) {
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y: -16,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
      });
    }, ref);
    return () => ctx.revert();
  }, [ref]);
}
