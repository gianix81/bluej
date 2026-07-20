import { useEffect, useRef, useState } from "react";
import { INTRO_VIDEO } from "./data";

/**
 * Video hero a tutto schermo in autoplay muto e loop: scorre fluido da
 * solo; lo scroll si limita a far salire il pannello sopra.
 */
export function VideoCanvas() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // Fallback: mostra comunque il canvas se i browser ritardano gli
  // eventi di caricamento.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Avvio esplicito (alcuni browser ignorano l'attributo autoplay) e
  // rispetto della preferenza di riduzione del movimento.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;
    void video.play().catch(() => {
      // Se l'autoplay viene bloccato, riprova alla prima interazione.
      const retry = () => {
        void video.play().catch(() => {});
        window.removeEventListener("touchstart", retry);
        window.removeEventListener("click", retry);
      };
      window.addEventListener("touchstart", retry, { passive: true });
      window.addEventListener("click", retry);
    });
  }, []);

  return (
    <div
      id="main-canvas"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{
        zIndex: 0,
        width: "100%",
        height: "100%",
        opacity: ready ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <video
        ref={videoRef}
        src={INTRO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedMetadata={() => setReady(true)}
        onError={() => setReady(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
