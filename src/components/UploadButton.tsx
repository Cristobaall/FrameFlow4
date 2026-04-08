"use client";
import { useState, useRef, useCallback } from "react";
import { getUploadUrl, saveVideo } from "@/app/actions/videos";
import { useRouter } from "next/navigation";

export default function UploadButton() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle"|"uploading"|"saving"|"done"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) { setErrorMsg("Fichier non supporte."); return; }
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    setErrorMsg("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, []);

  const upload = async () => {
    if (!file || !title.trim()) return;
    setStatus("uploading"); setProgress(0); setErrorMsg("");
    try {
      const { presignedUrl, key } = await getUploadUrl(file.name, file.type, file.size);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Erreur: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Erreur reseau"));
        xhr.send(file);
      });
      const duration = await new Promise<number>((resolve) => {
        const v = document.createElement("video");
        v.src = URL.createObjectURL(file); v.preload = "metadata";
        v.onloadedmetadata = () => resolve(v.duration);
        v.onerror = () => resolve(0);
      });
      setStatus("saving");
      await saveVideo({ title: title.trim(), description: desc.trim() || undefined, r2Key: key, duration, fileSize: file.size });
      setStatus("done");
      setTimeout(() => { setOpen(false); reset(); router.refresh(); }, 1200);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Erreur lors de l upload");
    }
  };

  const reset = () => {
    setFile(null); setTitle(""); setDesc(""); setProgress(0);
    setStatus("idle"); setErrorMsg("");
  };

  if (!open) return (
    <button className="btn btn-primary" onClick={() => setOpen(true)}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      Uploader
    </button>
  );

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <span className="modal-title">Uploader une video</span>
          <button className="btn-icon" onClick={() => { setOpen(false); reset(); }} aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          {!file ? (
            <div className={`drop-zone${dragging ? " drag-over" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}>
              <div className="drop-zone-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="drop-zone-title">Depose ta video ici</p>
              <p className="drop-zone-sub">ou clique pour parcourir</p>
              <button className="btn btn-primary"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                Choisir un fichier
              </button>
              <p className="drop-zone-hint">MP4, MOV, WebM, AVI </p>
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
                padding: "10px 12px", background: "var(--color-surface-2)",
                borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--color-primary)" }}>
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <path d="m10 9 5 3-5 3V9z"/>
                </svg>
                <span style={{
                  fontSize: 13, flex: 1, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>{file.name}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-faint)", flexShrink: 0 }}>
                  {(file.size / 1024 / 1024).toFixed(1)} Mo
                </span>
                {status === "idle" && (
                  <button className="btn-icon" style={{ width: 24, height: 24 }}
                    onClick={reset} aria-label="Retirer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vid-title">Titre *</label>
                <input id="vid-title" className="form-input" value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Titre de la video"
                  disabled={status !== "idle"} maxLength={120} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vid-desc">Description</label>
                <textarea id="vid-desc" className="form-textarea" value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Description (facultatif)"
                  disabled={status !== "idle"} rows={3} />
              </div>
              {(status === "uploading" || status === "saving") && (
                <div>
                  <div className="progress-label">
                    <span>{status === "saving" ? "Enregistrement..." : "Upload en cours..."}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill"
                      style={{ width: `${status === "saving" ? 100 : progress}%` }} />
                  </div>
                </div>
              )}
              {status === "done" && (
                <p style={{ fontSize: 13, color: "var(--color-success)", marginTop: 8 }}>
                  Video publiee avec succes !
                </p>
              )}
              {errorMsg && (
                <p style={{ fontSize: 13, color: "var(--color-error)", marginTop: 8 }}>
                  {errorMsg}
                </p>
              )}
            </>
          )}
          <input ref={inputRef} type="file" accept="video/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {file && status === "idle" && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => { setOpen(false); reset(); }}>
              Annuler
            </button>
            <button className="btn btn-primary" onClick={upload} disabled={!title.trim()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Publier la video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}