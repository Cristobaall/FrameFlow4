import { createClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/types";
import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import UploadButton from "@/components/UploadButton";
import StorageManager from "@/components/StorageManager";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: videos } = await supabase
    .from("videos").select("*").order("created_at", { ascending: false });

  return (
    <>
      <Header user={user} />
      <main className="page-home">
        <div className="page-header">
          <h1 className="page-title">Toutes les videos</h1>
          {user && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StorageManager videos={(videos as Video[]) ?? []} user={user} />
              <UploadButton />
            </div>
          )}
        </div>
        <VideoGrid videos={(videos as Video[]) ?? []} user={user} />
      </main>
    </>
  );
}