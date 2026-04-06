"use client";
import type { User } from "@supabase/supabase-js";
import { signInWithGoogle, signOut } from "@/app/actions/auth";
import Link from "next/link";

export default function Header({ user }: { user: User | null }) {
  return (
    <header className="header">
      <Link
        href="/"
        className="logo"
        style={{
          display: "flex",
          alignItems: "center",
          textDecoration: "none",
        }}
      >
        <img
          src="/logo-frameflow.png"
          alt="FrameFlow"
          style={{
            display: "block",
            height: 50,
            width: "auto",
            maxWidth: 280,
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {user ? (
          <>
            <div className="avatar">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name ?? "User"}
                />
              ) : (
                user.user_metadata?.full_name?.[0] ?? "U"
              )}
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
              >
                Deconnexion
              </button>
            </form>
          </>
        ) : (
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="btn btn-ghost"
              style={{ fontSize: 13 }}
            >
              Se connecter
            </button>
          </form>
        )}
      </div>
    </header>
  );
}