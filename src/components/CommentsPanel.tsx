"use client";
import { useState, useEffect, useTransition, useRef } from "react";
import type { Video, Comment } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { addComment, deleteComment } from "@/app/actions/comments";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/app/actions/auth";

function formatTimecode(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function CommentsPanel({ video, initialComments, user }: {
  video: Video; initialComments: Comment[]; user: User | null;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const poll = setInterval(() => {
      const vid = document.getElementById("main-video-player") as HTMLVideoElement | null;
      if (vid) setCurrentTime(vid.currentTime);
    }, 250);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${video.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "comments",
        filter: `video_id=eq.${video.id}`
      }, (payload) => {
        setComments((prev) => {
          if (prev.find(c => c.id === payload.new.id)) return prev;
          return [...prev, payload.new as Comment].sort((a, b) => a.timecode - b.timecode);
        });
      })
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "comments",
        filter: `video_id=eq.${video.id}`
      }, (payload) => {
        setComments((prev) => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [video.id]);

  const seekTo = (timecode: number) => {
    const vid = document.getElementById("main-video-player") as HTMLVideoElement | null;
    if (vid) { vid.currentTime = timecode; vid.play(); }
  };

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!text.trim() || !user) return;
    const content = text.trim();
    const timecode = currentTime;
    setText("");
    startTransition(async () => {
      await addComment({ videoId: video.id, content, timecode });
    });
  };

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      await deleteComment(commentId, video.id);
    });
  };

  const doneCount = checked.size;

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <span>Commentaires ({comments.length})</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {doneCount > 0 && (
            <span style={{
              fontSize: 11, color: "var(--color-success)",
              background: "rgba(34,197,94,0.12)",
              padding: "2px 8px", borderRadius: 999, fontWeight: 600
            }}>
              {doneCount} effectué{doneCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="comments-list">
        {comments.length === 0 ? (
          <div style={{
            padding: "40px 18px", textAlign: "center",
            color: "var(--color-text-faint)", fontSize: 13
          }}>
            Aucun commentaire.<br />Sois le premier !
          </div>
        ) : comments.map((c) => {
          const isDone = checked.has(c.id);
          return (
            <div key={c.id} className="comment-item"
              onClick={() => seekTo(c.timecode)}
              title={`Aller a ${formatTimecode(c.timecode)}`}
              style={{ opacity: isDone ? 0.5 : 1, transition: "opacity 0.2s" }}>
              <div className="comment-header">
                <button
                  onClick={(e) => toggleCheck(c.id, e)}
                  title={isDone ? "Marquer comme non effectué" : "Marquer comme effectué"}
                  style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${isDone ? "var(--color-success)" : "var(--color-border)"}`,
                    background: isDone ? "var(--color-success)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", cursor: "pointer",
                  }}>
                  {isDone && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>

                <span className="comment-timecode">{formatTimecode(c.timecode)}</span>
                <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
                  {c.user_avatar
                    ? <img src={c.user_avatar} alt={c.user_name ?? ""} referrerPolicy="no-referrer" />
                    : (c.user_name?.[0] ?? "U")}
                </div>
                <span className="comment-user">{c.user_name ?? "Anonyme"}</span>
                <span className="comment-date">
                  {new Date(c.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short"
                  })}
                </span>
                {user && (
                  <button
                    className="btn-icon btn-sm"
                    style={{ width: 42, height: 37, opacity: 1, color: "var(--color-error)", flexShrink: 0 }}
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    aria-label="Supprimer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
              <p className="comment-text" style={{
                textDecoration: isDone ? "line-through" : "none",
                color: isDone ? "var(--color-text-faint)" : undefined
              }}>
                {c.content}
              </p>
            </div>
          );
        })}
      </div>
      {user ? (
        <div className="comment-form">
          <div className="comment-timecode-indicator">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Timecode : <strong>{formatTimecode(currentTime)}</strong>
          </div>
          <textarea
            ref={textareaRef}
            className="comment-textarea"
            placeholder="Ajoute un commentaire..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            rows={3}
          />
          <div className="comment-form-footer">
            <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>
              Shift+Entrée pour aller à la ligne
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={!text.trim() || isPending}>
              {isPending ? "..." : "Commenter"}
            </button>
          </div>
        </div>
      ) : (
        <div className="comment-login-prompt">
          <form action={signInWithGoogle} style={{ display: "inline" }}>
            <button type="submit" className="btn btn-primary btn-sm">
              Se connecter avec Google
            </button>
          </form>
          {" "}pour commenter
        </div>
      )}
    </div>
  );
}