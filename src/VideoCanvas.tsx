import { useEffect, useRef, useState } from "react";
import { GALLERY_IMAGES, INTRO_VIDEO } from "./data";

/** Hero statico per mobile: ritratto frontale, niente video. */
export function HeroImage() {
  return (
    <div
      id="main-canvas"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <img
        src={GALLERY_IMAGES[0]}
        alt="blue•j — collezione donna"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

/**
 * Video hero a tutto schermo, mai in autoplay: il currentTime viene
 * guidato dallo scroll (dal RAF in App) tramite l'id "intro-video".
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

  // Primo tocco: "sblocca" i frame del video su touch (play muto +
  // pausa), altrimenti il seek non ha nulla da mostrare.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let primed = false;
    const prime = () => {
      if (primed) return;
      primed = true;
      video
        .play()
        .then(() => {
          video.pause();
          video.currentTime = 0;
        })
        .catch(() => {});
      window.removeEventListener("touchstart", prime);
    };
    window.addEventListener("touchstart", prime, { passive: true });
    return () => window.removeEventListener("touchstart", prime);
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
        id="intro-video"
        ref={videoRef}
        src={INTRO_VIDEO}
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={() => setReady(true)}
        onError={() => setReady(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
