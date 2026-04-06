export interface Video {
  id: string;
  title: string;
  description: string | null;
  r2_key: string;
  public_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  uploader_id: string;
  uploader_name: string | null;
  uploader_avatar: string | null;
  created_at: string;
  view_count: number;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  content: string;
  timecode: number;
  created_at: string;
}
