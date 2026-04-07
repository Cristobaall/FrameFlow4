"use client";
import { useEffect, useRef } from "react";
import type { Video, Comment } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface VideoPlayerProps {
  video: Video;
  comments?: Comment[];
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__videoRef = videoRef;
  }, []);

  return (
    <div className="video-main">
      <div className="video-player-wrap">
        <video
          ref={videoRef}
          src={video.public_url}
          controls
          preload="metadata"
          id="main-video-player"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="video-info">
        <h1>{video.title}</h1>
        <div className="video-info-meta">
          <div className="video-uploader">
            <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
              {video.uploader_avatar ? (
                <img src={video.uploader_avatar} alt={video.uploader_name ?? ""} />
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
          <p
            style={{
              marginTop: 14,
              fontSize: 14,
              color: "var(--color-text-muted)",
              lineHeight: 1.7,
            }}
          >
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}