"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Video, Comment } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

interface VideoPlayerProps {
  video: Video;
  comments?: Comment[];
}

const SPEEDS = [1, 1.5, 2];

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => setCurrentTime(vid.currentTime);
    const onMeta = () => setDuration(vid.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("play", onPlay);
    vid.addEventListener("pause", onPause);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("loadedmetadata", onMeta);
      vid.removeEventListener("play", onPlay);
      vid.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__videoRef = videoRef;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const vid = videoRef.current;
      if (!vid) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") { e.preventDefault(); playing ? vid.pause() : vid.play(); }
      if (e.key === "ArrowRight") { e.preventDefault(); vid.currentTime = Math.min(vid.currentTime + 5, duration); }
      if (e.key === "ArrowLeft") { e.preventDefault(); vid.currentTime = Math.max(vid.currentTime - 5, 0); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [playing, duration]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    playing ? vid.pause() : vid.play();
  };

  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !muted;
    setMuted(!muted);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setMuted(v === 0);
  };

  const handleProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const vid = videoRef.current;
    if (!bar || !vid) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    vid.currentTime = pct * duration;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="video-main">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowControls(false)}
        onMouseEnter={() => setShowControls(true)}
        style={{
          position: "relative", background: "#000",
          borderRadius: 12, overflow: "hidden",
          aspectRatio: "16/9", cursor: "pointer",
          marginBottom: 18,
        }}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={video.public_url}
          preload="metadata"
          id="main-video-player"
          style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
        />

        {/* Play/Pause overlay */}
        {!playing && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
            padding: "32px 16px 14px",
            transition: "opacity 0.3s",
            opacity: showControls || !playing ? 1 : 0,
          }}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleProgress}
            style={{
              height: 4, background: "rgba(255,255,255,0.3)",
              borderRadius: 999, marginBottom: 12, cursor: "pointer",
              position: "relative",
            }}
          >
            <div style={{
              width: `${progress}%`, height: "100%",
              background: "var(--color-primary)", borderRadius: 999,
              position: "relative",
            }}>
              <div style={{
                position: "absolute", right: -6, top: "50%",
                transform: "translateY(-50%)",
                width: 12, height: 12, borderRadius: "50%",
                background: "#fff",
              }} />
            </div>
          </div>

          {/* Controls row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={{
              background: "none", border: "none", color: "#fff",
              cursor: "pointer", display: "flex", padding: 0,
            }}>
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Volume */}
            <button onClick={toggleMute} style={{
              background: "none", border: "none", color: "#fff",
              cursor: "pointer", display: "flex", padding: 0,
            }}>
              {muted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolume}
              style={{ width: 70, accentColor: "var(--color-primary)" }}
            />

            {/* Time */}
            <span style={{ fontSize: 12, color: "#fff", fontVariantNumeric: "tabular-nums", marginLeft: 4 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div style={{ flex: 1 }} />

            {/* Speed buttons */}
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                style={{
                  padding: "3px 10px", borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                  border: `1px solid ${speed === s ? "#fff" : "rgba(255,255,255,0.4)"}`,
                  background: speed === s ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.4)",
                  color: speed === s ? "#000" : "#fff",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {s === 1 ? "x1" : `x${s}`}
              </button>
            ))}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} style={{
              background: "none", border: "none", color: "#fff",
              cursor: "pointer", display: "flex", padding: 0, marginLeft: 4,
            }}>
              {fullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video info */}
      <div className="video-info">
        <h1>{video.title}</h1>
        <div className="video-info-meta">
          <div className="video-uploader">
            <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
              {video.uploader_avatar ? (
                <img src={video.uploader_avatar} alt={video.uploader_name ?? ""} referrerPolicy="no-referrer" />
              ) : (
                video.uploader_name?.[0] ?? "A"
              )}
            </div>
            <span>{video.uploader_name ?? "Anonyme"}</span>
          </div>
          <span>·</span>
          <span>{formatDate(video.created_at)}</span>
        </div>
        {video.description && (
          <p style={{
            marginTop: 14, fontSize: 14,
            color: "var(--color-text-muted)", lineHeight: 1.7,
          }}>
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}