"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";

/**
 * World-Class Smooth Scrolling Provider
 * Direct implementation of the Lenis engine for React 19 compatibility.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Initial scroll sync for layout shifts
    lenis.scrollTo(0, { immediate: true });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
