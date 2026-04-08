import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: files, error } = await supabase
    .storage
    .from("videos")
    .list("", { limit: 1000 });

  if (error) {
    return NextResponse.json(
      { error: error.message, usedGB: 0, totalGB: 10, percent: 0 },
      { status: 500 }
    );
  }

  let totalBytes = 0;

  if (files) {
    for (const f of files) {
      totalBytes += f.metadata?.size ?? 0;
    }
  }

  const usedGB = totalBytes / (1024 ** 3);
  const totalGB = 10;
  const percent = Math.min((usedGB / totalGB) * 100, 100);

  return NextResponse.json({ usedGB, totalGB, percent });
}