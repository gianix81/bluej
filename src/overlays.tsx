import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { CAPTION_TEXT } from "./data";
import type { Viewport } from "./useViewport";

const EASE = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
});

/* ---------------------------------- 1A. Custom cursor ---------------------------------- */

export function CustomCursor({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed"
      style={{
        left: -100,
        top: -100,
        zIndex: 50,
        transform: "translate(-50%, -50%)",
        mixBlendMode: "exclusion",
      }}
    >
      <svg width={48} height={48} viewBox="0 0 48 48" fill="none">
        <circle cx={24} cy={24} r={22.75} stroke="#fff" strokeWidth={2.5} />
        <path
          d="M24 11.5 L27.2 20.8 L36.5 24 L27.2 27.2 L24 36.5 L20.8 27.2 L11.5 24 L20.8 20.8 Z"
          fill="#fff"
        />
      </svg>
    </div>
  );
}

/* ---------------------------------- 1B. Logo ---------------------------------- */

export function Logo({ vp }: { vp: Viewport }) {
  const width = vp.isMobile ? 124 : vp.isTablet ? 266 : 355;
  const inset = vp.isMobile ? 16 : 32;

  return (
    <motion.div
      {...fadeUp(0)}
      className="pointer-events-none fixed"
      style={{ top: inset, left: inset, zIndex: 20, mixBlendMode: "exclusion" }}
    >
      <img
        src="/media/logo.png"
        alt="blue•j"
        draggable={false}
        style={{ width, height: "auto" }}
      />
    </motion.div>
  );
}

/* ---------------------------------- 1C. Caption ---------------------------------- */

export function Caption({ vp }: { vp: Viewport }) {
  return (
    <motion.div
      id="hero-caption"
      {...fadeUp(0.3)}
      className="pointer-events-none fixed"
      style={{
        left: vp.isMobile ? 16 : 32,
        top: vp.isDesktop ? 244 : vp.isTablet ? 180 : 118,
        width: vp.isDesktop
          ? 400
          : vp.isTablet
            ? "calc(45vw - 48px)"
            : "calc(100vw - 32px)",
        zIndex: 20,
        mixBlendMode: "exclusion",
        fontWeight: 500,
        fontSize: vp.isMobile ? 17 : 16,
        lineHeight: "150%",
        letterSpacing: "-0.02em",
        color: "#FFFFFF",
      }}
    >
      {CAPTION_TEXT}
    </motion.div>
  );
}

/* ---------------------------------- 1D. Header navigation ---------------------------------- */

export function HeaderNav({ vp }: { vp: Viewport }) {
  const inset = vp.isMobile ? 16 : 32;
  const iconSize = vp.isMobile ? 24 : 30;

  return (
    <motion.header
      {...fadeUp(0.15)}
      className="pointer-events-none fixed flex items-center justify-between"
      style={{
        top: inset,
        right: inset,
        width: vp.isMobile ? "auto" : 330,
        height: 30,
        zIndex: 20,
        mixBlendMode: "exclusion",
      }}
    >
      {!vp.isMobile && (
        <span
          className="uppercase"
          style={{ fontWeight: 500, fontSize: 15, color: "#fff" }}
        >
          Chi siamo
        </span>
      )}
      <div
        className="flex items-center"
        style={{ gap: vp.isMobile ? 20 : 50 }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 40 40"
          fill="none"
        >
          <path d="M0 14H40" stroke="#fff" strokeWidth={2.5} />
          <path d="M0 26H40" stroke="#fff" strokeWidth={2.5} />
        </svg>
        <span
          style={{
            fontWeight: 500,
            fontSize: vp.isMobile ? 13 : 15,
            color: "#fff",
          }}
        >
          [ CARRELLO ]
        </span>
      </div>
    </motion.header>
  );
}

/* ---------------------------------- 1E. Product info ---------------------------------- */

export function ProductInfo({ vp }: { vp: Viewport }) {
  const circleSize = vp.isMobile ? 20 : 30;

  return (
    <motion.div
      id="outro-info"
      data-outro-offset={vp.isMobile ? 132 : 166}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
      className="pointer-events-none fixed flex flex-col items-center"
      style={{
        zIndex: 20,
        mixBlendMode: "exclusion",
        ...(vp.isMobile
          ? { left: 0, right: 0, bottom: 48 }
          : { right: 32, bottom: 80, width: 330 }),
      }}
    >
      <div
        className="flex flex-col items-start"
        style={{
          width: vp.isMobile ? 252 : "100%",
          marginBottom: vp.isMobile ? 12 : 32,
        }}
      >
        <div
          className="relative"
          style={{ width: circleSize, height: circleSize }}
        >
          <svg
            width={circleSize}
            height={circleSize}
            viewBox="0 0 40 40"
            fill="none"
          >
            <circle
              cx={20}
              cy={20}
              r={18.75}
              stroke="#fff"
              strokeWidth={vp.isMobile ? 2 : 2.5}
            />
          </svg>
          <span
            id="circle-symbol"
            className="absolute inset-0 flex items-center justify-center uppercase"
            style={{
              fontWeight: 500,
              fontSize: vp.isMobile ? 10 : 15,
              letterSpacing: "-0.04em",
              color: "#fff",
            }}
          >
            8
          </span>
        </div>
        <div
          className="uppercase"
          style={{
            fontWeight: 500,
            fontSize: vp.isMobile ? 24 : 30,
            lineHeight: "100%",
            textAlign: "center",
            letterSpacing: "-0.04em",
            color: "#fff",
          }}
        >
          Collezione donna
          <br />
          "Potenza"
        </div>
      </div>
      <div
        style={{
          fontWeight: 500,
          fontSize: vp.isMobile ? 60 : 80,
          lineHeight: "100%",
          textAlign: "center",
          letterSpacing: "-0.04em",
          color: "#fff",
        }}
      >
        €149,00
      </div>
    </motion.div>
  );
}

/* ---------------------------------- 1F. "View" button ---------------------------------- */

export function ViewButton({ vp }: { vp: Viewport }) {
  return (
    <div
      id="outro-buy"
      className="pointer-events-none fixed flex items-center justify-center"
      style={{
        zIndex: 20,
        mixBlendMode: "exclusion",
        background: "#fff",
        borderRadius: 1335,
        transformOrigin: "right bottom",
        transform: "scale(0)",
        ...(vp.isMobile
          ? { left: 16, right: 16, bottom: 60, height: 100 }
          : { right: 32, bottom: 32, width: 330, height: 174 }),
      }}
    >
      <span
        style={{
          fontWeight: 500,
          fontSize: vp.isMobile ? 72 : 110,
          letterSpacing: "-0.04em",
          color: "#fff",
          mixBlendMode: "exclusion",
        }}
      >
        shop
      </span>
    </div>
  );
}

/* ---------------------------------- 1I. White overlay ---------------------------------- */

export function WhiteOverlay() {
  return (
    <div
      id="outro-overlay"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 12, background: "#fff", opacity: 0 }}
    />
  );
}

/* ---------------------------------- 1J. Footer ---------------------------------- */

export function OutroFooter({ vp }: { vp: Viewport }) {
  return (
    <footer
      id="outro-footer"
      className="pointer-events-none fixed flex uppercase"
      style={{
        left: 16,
        bottom: vp.isMobile ? 24 : 32,
        zIndex: 20,
        opacity: 0,
        mixBlendMode: "exclusion",
        fontWeight: 500,
        fontSize: vp.isMobile ? 11 : 13,
        letterSpacing: "-0.02em",
        color: "#fff",
        ...(vp.isMobile
          ? { right: 16, justifyContent: "space-between" }
          : { gap: 80 }),
      }}
    >
      <span>BLUE•J (R) 2026</span>
      <span>PRIVACY POLICY</span>
    </footer>
  );
}
