"use client";
import type { User } from "@supabase/supabase-js";
import { signInWithGoogle, signOut } from "@/app/actions/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

async function fetchStorageUsage(): Promise<{ usedGB: number; totalGB: number; percent: number }> {
  const res = await fetch("/api/storage-usage");
  return res.json();
}

export default function Header({ user }: { user: User | null }) {
  const [storage, setStorage] = useState<{ usedGB: number; totalGB: number; percent: number } | null>(null);

  useEffect(() => {
    if (user) fetchStorageUsage().then(setStorage);
  }, [user]);

  return (
    <header className="header">
      <Link
        href="/"
        className="logo"
        style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
      >
        <img
          src="/logo-frameflow.png?v=1"
          alt="FrameFlow"
          style={{ display: "block", height: 50, width: "auto", maxWidth: 280, objectFit: "contain", flexShrink: 0 }}
        />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user && storage && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "var(--color-text-muted)"
          }}>
            <span>💾</span>
            <div style={{ width: 80, height: 6, background: "var(--color-surface-offset)", borderRadius: 999 }}>
              <div style={{
                width: `${storage.percent}%`, height: "100%", borderRadius: 999,
                background: storage.percent > 80 ? "#e53e3e" : storage.percent > 50 ? "#dd6b20" : "#38a169"
              }} />
            </div>
            <span>{storage.usedGB.toFixed(2)} / {storage.totalGB} Go</span>
          </div>
        )}

        {user ? (
          <>
            <div className="avatar">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name ?? "User"} />
              ) : (
                user.user_metadata?.full_name?.[0] ?? "U"
              )}
            </div>
            <form action={signOut}>
              <button type="submit" className="btn btn-ghost" style={{ fontSize: 13 }}>
                Deconnexion
              </button>
            </form>
          </>
        ) : (
          <form action={signInWithGoogle}>
            <button type="submit" className="btn btn-ghost" style={{ fontSize: 13 }}>
              Se connecter
            </button>
          </form>
        )}
      </div>
    </header>
  );
}