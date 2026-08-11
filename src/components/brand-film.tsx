"use client";

import { useEffect, useRef, useState } from "react";

export function BrandFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!video || motionQuery.matches) {
      return;
    }

    void video.play().catch(() => setIsPlaying(false));

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      if (event.matches) {
        video.pause();
        setIsPlaying(false);
      }
    };

    motionQuery.addEventListener("change", handleMotionPreference);
    return () => motionQuery.removeEventListener("change", handleMotionPreference);
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      void video.play().catch(() => setIsPlaying(false));
      return;
    }

    video.pause();
    setIsPlaying(false);
  }

  return (
    <figure className="brand-film">
      <video
        ref={videoRef}
        className="brand-film-video"
        muted
        loop
        playsInline
        preload="metadata"
        poster="/brand/film-poster.webp"
        aria-label="The folded Vibe to Code cursor assembling into the wordmark"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src="/brand/vibe-to-code-film.mp4" type="video/mp4" />
      </video>

      <figcaption className="brand-film-caption">
        <span>
          <i aria-hidden="true" /> Identity system / 03
        </span>
        <button type="button" onClick={togglePlayback}>
          {isPlaying ? "Pause film" : "Play film"}
        </button>
      </figcaption>

      <div className="brand-film-index" aria-hidden="true">
        <span>VTC</span>
        <span>2026</span>
      </div>
    </figure>
  );
}
