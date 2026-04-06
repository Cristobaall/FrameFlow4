import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Video, Comment } from "@/lib/types";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import CommentsPanel from "@/components/CommentsPanel";

export const revalidate = 0;

interface Props { params: Promise<{ id: string }>; }

export default async function VideoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: video } = await supabase
    .from("videos").select("*").eq("id", id).single();
  if (!video) notFound();

  const { data: comments } = await supabase
    .from("comments").select("*")
    .eq("video_id", id).order("timecode", { ascending: true });

  return (
    <>
      <Header user={user} />
      <div className="page-video">
        <VideoPlayer
          video={video as Video}
          comments={(comments as Comment[]) ?? []}
        />
        <CommentsPanel
          video={video as Video}
          initialComments={(comments as Comment[]) ?? []}
          user={user}
        />
      </div>
    </>
  );
}