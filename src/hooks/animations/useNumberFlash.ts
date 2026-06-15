import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function useNumberFlash<T extends HTMLElement = HTMLSpanElement>(
  value: number,
) {
  const ref = useRef<T>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current || prev.current === value) return;
    const isUp = value > prev.current;
    prev.current = value;

    const flash = isUp
      ? 'rgba(239, 68, 68, 0.25)'
      : 'rgba(16, 185, 129, 0.25)';

    gsap.fromTo(
      ref.current,
      { backgroundColor: flash },
      { backgroundColor: 'transparent', duration: 0.9, ease: 'power2.out' },
    );
  }, [value]);

  return ref;
}
