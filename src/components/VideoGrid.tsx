"use client";
import type { Video } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { signInWithGoogle } from "@/app/actions/auth";

function formatDuration(s: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric"
  });
}

export default function VideoGrid({ videos, user }: { videos: Video[]; user: User | null }) {
  if (!videos.length) return (
    <div className="empty">
      <div className="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="6" width="20" height="14" rx="2"/>
          <path d="m10 9 5 3-5 3V9z"/>
        </svg>
      </div>
      <h3>Aucune video pour l&apos;instant</h3>
      <p>Sois le premier a partager une video.</p>
      {!user && (
        <form action={signInWithGoogle}>
          <button type="submit" className="btn btn-primary">
            Se connecter pour uploader
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="video-grid">
      {videos.map((v) => (
        <Link key={v.id} href={`/video/${v.id}`} className="video-card">
          <div className="video-card-thumb">
            <video src={v.public_url} preload="metadata" muted tabIndex={-1} aria-hidden />
            <div className="video-card-play">
              <div className="play-circle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
            {v.duration && (
              <span className="video-duration">{formatDuration(v.duration)}</span>
            )}
          </div>
          <div className="video-card-info">
            <p className="video-card-title">{v.title}</p>
            <div className="video-card-meta">
              <span>{v.uploader_name ?? "Anonyme"}</span>
              <span>·</span>
              <span>{formatDate(v.created_at)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}