"use server";
import { createClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { revalidatePath } from "next/cache";

export async function getUploadUrl(fileName: string, fileType: string, fileSize: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifie");
  if (fileSize > 5000 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 500 Mo)");

  const ext = fileName.split(".").pop();
  const key = `videos/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key,
    ContentType: fileType, ContentLength: fileSize,
  });

  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  return { presignedUrl, key };
}

export async function saveVideo(data: {
  title: string; description?: string; r2Key: string; duration?: number; fileSize?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifie");

  const publicUrl = `${R2_PUBLIC_URL}/${data.r2Key}`;
  const { error } = await supabase.from("videos").insert({
    title: data.title,
    description: data.description ?? null,
    r2_key: data.r2Key,
    public_url: publicUrl,
    duration: data.duration ?? null,
    file_size: data.fileSize ?? null,
    uploader_id: user.id,
    uploader_name: user.user_metadata?.full_name ?? user.email,
    uploader_avatar: user.user_metadata?.avatar_url ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteVideo(videoId: string, r2Key: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifie");

  await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: r2Key }));
  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}