"use client";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Video } from "@/lib/types";
import { deleteVideo } from "@/app/actions/videos";

interface Props {
  videos: Video[];
  user: User;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} Go`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} Mo`;
  return `${(bytes / 1e3).toFixed(0)} Ko`;
}

export default function StorageManager({ videos, user }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalGB = 10;
  const usedBytes = videos.reduce((acc, v) => acc + (v.file_size ?? 0), 0);
  const usedGB = usedBytes / 1e9;
  const percent = Math.min((usedGB / totalGB) * 100, 100);

  async function handleDelete(video: Video) {
    if (!confirm(`Supprimer "${video.title}" ?`)) return;
    setDeleting(video.id);
    await deleteVideo(video.id, video.r2_key);
    setDeleting(null);
  }

  return (
    <>
      <button
        className="btn btn-ghost"
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
        onClick={() => setOpen(true)}
      >
        💾 Stockage
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#1a1a1a", borderRadius: 16, padding: 24,
            width: "100%", maxWidth: 560,
            border: "1px solid #2a2a2a",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  background: "#2563eb", borderRadius: 12,
                  width: 48, height: 48,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22,
                }}></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Gestion du Stockage</div>
                  <div style={{ fontSize: 11, color: "#888", letterSpacing: 1, marginTop: 2 }}>
                    CONTRÔLE DE LA BASE DE DONNÉES
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "none", border: "none", color: "#888",
                fontSize: 20, cursor: "pointer", lineHeight: 1,
              }}>✕</button>
            </div>

            {/* Liste des vidéos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {videos.map(video => (
                <div key={video.id} style={{
                  background: "#111", borderRadius: 12, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  border: "1px solid #2a2a2a",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "#222", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#888", fontSize: 16, flexShrink: 0,
                  }}>▶</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: 500, fontSize: 15 }}>{video.title}</div>
                    <div style={{ color: "#2563eb", fontSize: 13, marginTop: 2 }}>
                      {formatSize(video.file_size)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(video)}
                    disabled={deleting === video.id}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: deleting === video.id ? "#555" : "#e53e3e", fontSize: 18,
                    }}
                  >🗑</button>
                </div>
              ))}
            </div>

            {/* Footer stockage */}
            <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#888", letterSpacing: 1, marginBottom: 8 }}>
                STOCKAGE UTILISÉ
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>
                  {usedGB.toFixed(2)}
                  <span style={{ fontSize: 16, fontWeight: 400, color: "#888", marginLeft: 6 }}>
                    / {totalGB.toFixed(2)} Go
                  </span>
                </div>
                <div style={{ color: "#888", fontSize: 14 }}>{videos.length} vidéo{videos.length > 1 ? "s" : ""}</div>
              </div>
              <div style={{ height: 6, background: "#2a2a2a", borderRadius: 999 }}>
                <div style={{
                  width: `${percent}%`, height: "100%", borderRadius: 999,
                  background: percent > 80 ? "#e53e3e" : "#2563eb",
                  transition: "width 0.3s",
                }} />
              </div>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: "#222", border: "1px solid #2a2a2a",
                color: "#fff", fontSize: 15, cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}