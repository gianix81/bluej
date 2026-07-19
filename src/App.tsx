import { useEffect, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CIRCLE_SYMBOLS, GALLERY_IMAGES } from "./data";
import { useViewport } from "./useViewport";
import { HeroImage, VideoCanvas } from "./VideoCanvas";
import {
  Caption,
  CustomCursor,
  HeaderNav,
  Logo,
  OutroFooter,
  ProductInfo,
  ViewButton,
  WhiteOverlay,
} from "./overlays";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scattered grid: one image per row on a staggered primary column, plus a
 * second image every 3rd row. Empty cells are -1.
 */
function buildLayout(count: number, cols: number): number[][] {
  const rows: number[][] = [];
  let idx = 0;
  for (let r = 0; idx < count; r++) {
    const row = new Array<number>(cols).fill(-1);
    const a = (r * 2 + (r % 2)) % cols;
    row[a] = idx++;
    if (r % 3 === 0 && idx < count) {
      let b = (a + 2) % cols;
      if (b === a) b = (a + 1) % cols;
      row[b] = idx++;
    }
    rows.push(row);
  }
  return rows;
}

export default function App() {
  const vp = useViewport();
  const cols = vp.isMobile ? 2 : vp.isTablet ? 3 : 4;
  const rows = useMemo(() => buildLayout(GALLERY_IMAGES.length, cols), [cols]);

  useEffect(() => {
    const spacer = document.getElementById("scroll-spacer");
    const panel = document.getElementById("black-panel");
    const wrap = document.getElementById("panel-wrap");
    const overlay = document.getElementById("outro-overlay");
    const info = document.getElementById("outro-info");
    const buy = document.getElementById("outro-buy");
    const footer = document.getElementById("outro-footer");
    const canvas = document.getElementById("main-canvas");
    const symbol = document.getElementById("circle-symbol");
    if (!spacer || !panel || !wrap) return;

    const cards = Array.from(
      panel.getElementsByClassName("bp-card"),
    ) as HTMLElement[];

    let vh = window.innerHeight;
    let maxScroll = 0;
    // Cards live inside the fixed panel, so offsetTop is relative to the
    // panel's content top — stable under our transforms (unlike rects).
    let metrics: { el: HTMLElement; top: number; height: number }[] = [];

    const measure = () => {
      vh = window.innerHeight;
      maxScroll = Math.max(0, wrap.scrollHeight - vh);
      spacer.style.height = `${vh + maxScroll + 2 * vh}px`;
      metrics = cards.map((el) => ({
        el,
        top: el.offsetTop,
        height: el.offsetHeight,
      }));
      ScrollTrigger.refresh();
    };
    measure();

    // Phase 1: black panel slides up over the videos during the first 100vh.
    const slide = gsap.fromTo(
      panel,
      { y: () => window.innerHeight },
      {
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: spacer,
          start: 0,
          end: () => window.innerHeight,
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );

    let lastY = window.scrollY;
    let lastSymbolAt = 0;
    let raf = 0;

    const tick = (now: number) => {
      const y = window.scrollY;

      // Randomize the circle symbol while scrolling (throttled to 80ms).
      if (symbol && y !== lastY && now - lastSymbolAt > 80) {
        lastSymbolAt = now;
        symbol.textContent =
          CIRCLE_SYMBOLS[Math.floor(Math.random() * CIRCLE_SYMBOLS.length)];
      }
      lastY = y;

      // Phase 2: once the panel is docked, its content scrolls up instead.
      const panelOffset = Math.max(0, vh - y);
      const innerShift = Math.max(0, y - vh);
      wrap.style.transform = `translateY(${-innerShift}px)`;

      for (const m of metrics) {
        const top = panelOffset - innerShift + m.top;
        const bottom = top + m.height;
        let scale = 0;
        if (bottom > 0 && top < vh) {
          const enter = Math.min(1, (vh - top) / (vh * 0.6));
          const exit = Math.min(1, bottom / (vh * 0.4));
          scale = Math.max(0, Math.min(enter, exit));
        }
        m.el.style.transform = `scale(${scale})`;
      }

      // Videos can't be seen once the panel fully covers them.
      if (canvas) {
        canvas.style.visibility = y > vh ? "hidden" : "visible";
      }

      // Outro: white overlay, product info slides up, "view" button scales in.
      const progress = Math.min(
        1,
        Math.max(0, (y - vh - maxScroll) / (vh - 100)),
      );
      if (overlay) overlay.style.opacity = String(progress);
      if (footer) footer.style.opacity = String(progress);
      if (info) {
        const offset = Number(info.dataset.outroOffset ?? 166);
        info.style.transform = `translateY(${-offset * progress}px)`;
      }
      if (buy) buy.style.transform = `scale(${progress})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      slide.scrollTrigger?.kill();
      slide.kill();
    };
  }, [cols, vp.isMobile, vp.isDesktop]);

  const customCursor = vp.isDesktop && !vp.isTouch;

  return (
    <div
      id="scroll-spacer"
      className="relative select-none bg-white"
      style={{ height: "500vh", cursor: customCursor ? "none" : "auto" }}
    >
      {vp.isMobile ? <HeroImage /> : <VideoCanvas />}

      {/* Black gallery panel, starts one viewport below the fold */}
      <div
        id="black-panel"
        className="fixed inset-0 overflow-hidden bg-black"
        style={{ zIndex: 10, transform: "translateY(100vh)" }}
      >
        <div
          id="panel-wrap"
          style={{ width: "100%", paddingTop: "min(400px, 40vh)" }}
        >
          {rows.map((row, r) => (
            <div
              key={`${cols}-${r}`}
              className="grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {row.map((imageIdx, c) =>
                imageIdx === -1 ? (
                  <div key={c} style={{ aspectRatio: "2 / 3" }} />
                ) : (
                  <div
                    key={c}
                    className="bp-card"
                    style={{
                      aspectRatio: "2 / 3",
                      transform: "scale(0)",
                      transformOrigin:
                        c < cols / 2 ? "right bottom" : "left bottom",
                    }}
                  >
                    <img
                      src={GALLERY_IMAGES[imageIdx]}
                      alt={`blue•j — look ${imageIdx + 1}`}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <WhiteOverlay />
      <Logo vp={vp} />
      <HeaderNav vp={vp} />
      <Caption vp={vp} />
      <ProductInfo vp={vp} />
      <ViewButton vp={vp} />
      <OutroFooter vp={vp} />
      <CustomCursor enabled={customCursor} />
    </div>
  );
}
