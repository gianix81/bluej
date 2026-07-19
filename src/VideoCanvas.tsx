import { useEffect, useRef, useState } from "react";
import { LEFT_VIDEO, RIGHT_VIDEO } from "./data";
import type { Viewport } from "./useViewport";

/**
 * Two full-bleed videos.
 * Desktop (non-touch): paused, scrubbed by cursor X position in a RAF loop.
 * Touch devices: auto-play alternately (left first, then right, looping).
 */
export function VideoCanvas({ vp }: { vp: Viewport }) {
  const leftRef = useRef<HTMLVideoElement>(null);
  const rightRef = useRef<HTMLVideoElement>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const ready = loadedCount >= 2;

  const markLoaded = () => setLoadedCount((n) => n + 1);

  /* Desktop: cursor-scrub */
  useEffect(() => {
    if (vp.isTouch) return;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    let mouseX = window.innerWidth / 2;
    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
    };
    window.addEventListener("mousemove", onMove);

    // Which video is currently shown; right is visible on load.
    const activeSideRef = { current: "right" as "left" | "right" };
    left.style.display = "none";
    right.style.display = "block";

    const show = (side: "left" | "right") => {
      if (activeSideRef.current === side) return;
      activeSideRef.current = side;
      left.style.display = side === "left" ? "block" : "none";
      right.style.display = side === "right" ? "block" : "none";
    };

    const seekTo = (video: HTMLVideoElement, time: number) => {
      // Wait for the previous seek to finish rendering before requesting a
      // new one, otherwise playback gets jittery.
      if (video.seeking) return;
      if (!Number.isFinite(video.duration) || video.duration === 0) return;
      if (Math.abs(video.currentTime - time) < 0.001) return;
      video.currentTime = time;
    };

    let raf = 0;
    const tick = () => {
      const width = window.innerWidth;
      const center = width / 2;
      const deadZone = Math.max(30, width * 0.05);
      const dx = mouseX - center;

      if (Math.abs(dx) <= deadZone) {
        // Dead zone: keep whichever video was last active, parked at 0.
        const active = activeSideRef.current === "left" ? left : right;
        seekTo(active, 0);
      } else if (dx < 0) {
        // Cursor left of center: show RIGHT video, scrub from dead-zone edge
        // to the left screen edge.
        show("right");
        const range = center - deadZone;
        const progress = Math.min(1, Math.max(0, -(dx + deadZone) / range));
        if (Number.isFinite(right.duration)) {
          seekTo(right, progress * right.duration);
        }
      } else {
        // Cursor right of center: show LEFT video, scrub from dead-zone edge
        // to the right screen edge.
        show("left");
        const range = width - (center + deadZone);
        const progress = Math.min(1, Math.max(0, (dx - deadZone) / range));
        if (Number.isFinite(left.duration)) {
          seekTo(left, progress * left.duration);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [vp.isTouch]);

  /* Touch devices: alternate auto-play */
  useEffect(() => {
    if (!vp.isTouch) return;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const showAndPlay = (video: HTMLVideoElement, other: HTMLVideoElement) => {
      other.pause();
      other.style.display = "none";
      video.style.display = "block";
      video.currentTime = 0;
      if (!reducedMotion) void video.play().catch(() => {});
    };

    const onLeftEnded = () => showAndPlay(right, left);
    const onRightEnded = () => showAndPlay(left, right);
    left.addEventListener("ended", onLeftEnded);
    right.addEventListener("ended", onRightEnded);

    showAndPlay(left, right);

    return () => {
      left.removeEventListener("ended", onLeftEnded);
      right.removeEventListener("ended", onRightEnded);
      left.pause();
      right.pause();
    };
  }, [vp.isTouch]);

  return (
    <div
      id="main-canvas"
      className="pointer-events-none fixed overflow-hidden"
      style={{
        zIndex: 0,
        opacity: ready ? 1 : 0,
        transition: "opacity 0.3s ease",
        ...(vp.isMobile
          ? {
              left: 0,
              top: 220,
              width: "100vw",
              height: "calc(100vh - 220px)",
            }
          : { inset: 0, width: "100%", height: "100%" }),
      }}
    >
      <video
        ref={leftRef}
        src={LEFT_VIDEO}
        muted
        playsInline
        preload="auto"
        onLoadedData={markLoaded}
        onError={markLoaded}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ display: "none" }}
      />
      <video
        ref={rightRef}
        src={RIGHT_VIDEO}
        muted
        playsInline
        preload="auto"
        onLoadedData={markLoaded}
        onError={markLoaded}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ display: "block" }}
      />
    </div>
  );
}
