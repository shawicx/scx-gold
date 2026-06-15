import { useLayoutEffect, useRef, type RefObject, type DependencyList } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

export function useFlipSort<T extends HTMLElement>(
  ref: RefObject<T>,
  deps: DependencyList,
) {
  const stateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const prevState = stateRef.current;
    stateRef.current = Flip.getState(ref.current.children);

    if (!prevState) return;

    Flip.from(prevState, {
      duration: 0.4,
      ease: 'power2.inOut',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
