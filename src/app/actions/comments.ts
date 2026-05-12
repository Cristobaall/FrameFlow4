"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addComment(data: {
  videoId: string; content: string; timecode: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifie");

  const { error } = await supabase.from("comments").insert({
    video_id: data.videoId,
    user_id: user.id,
    user_name: user.user_metadata?.full_name ?? user.email,
    user_avatar: user.user_metadata?.avatar_url ?? null,
    content: data.content,
    timecode: data.timecode,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/video/${data.videoId}`);
}

export async function deleteComment(commentId: string, videoId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifie");

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/video/${videoId}`);
}

export async function toggleCommentCheck(commentId: string, isChecked: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifie");

  const { error } = await supabase
    .from("comments")
    .update({ is_checked: isChecked })
    .eq("id", commentId);

  if (error) throw new Error(error.message);
}