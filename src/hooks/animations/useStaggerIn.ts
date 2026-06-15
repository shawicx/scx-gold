import { useLayoutEffect, type RefObject, type DependencyList } from 'react';
import { gsap } from 'gsap';

interface StaggerOpts {
  duration?: number;
  y?: number;
  stagger?: number;
}

export function useStaggerIn<T extends HTMLElement>(
  ref: RefObject<T>,
  deps: DependencyList,
  opts: StaggerOpts = {},
) {
  const { duration = 0.35, y = 16, stagger = 0.05 } = opts;

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current!.children, {
        opacity: 0,
        y,
        duration,
        stagger,
        ease: 'power2.out',
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
