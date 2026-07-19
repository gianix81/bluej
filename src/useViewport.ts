import { useEffect, useState } from "react";

export interface Viewport {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
}

function compute(): Viewport {
  const w = window.innerWidth;
  return {
    width: w,
    isMobile: w < 640,
    isTablet: w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    isTouch:
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window,
  };
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(compute);

  useEffect(() => {
    const onResize = () => setVp(compute());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vp;
}
