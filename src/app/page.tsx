import { createClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";
import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import UploadButton from "@/components/UploadButton";
import StorageManager from "@/components/StorageManager";
import { signInWithGoogle } from "@/app/actions/auth";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: videos } = await supabase
    .from("videos").select("*").order("created_at", { ascending: false });

  return (
    <>
      <Header user={user} />
      {!user ? (
        <main style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "calc(100vh - 70px)",
          gap: 16,
        }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Bienvenue sur FrameFlow
          </h1>
          <p style={{ color: "var(--color-text-faint)", fontSize: 15, marginBottom: 16 }}>
            Connectez-vous pour accéder aux vidéos
          </p>
          <form action={signInWithGoogle}>
            <button type="submit" className="btn btn-primary">
              Se connecter avec Google
            </button>
          </form>
        </main>
      ) : (
        <main className="page-home">
          <div className="page-header">
            <h1 className="page-title">Toutes les videos</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StorageManager videos={(videos as Video[]) ?? []} user={user} />
              <UploadButton />
            </div>
          </div>
          <VideoGrid videos={(videos as Video[]) ?? []} user={user} />
        </main>
      )}
    </>
  );
}