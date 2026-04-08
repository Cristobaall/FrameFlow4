'use server';
import { createClient } from "@/lib/supabase/server";

export async function getStorageUsage() {
  const supabase = await createClient();
  
  const { data: usage } = await supabase.storage.getUsage();
  
  const totalGB = 10; // Ton quota Supabase
  const usedGB = usage?.file_size_bytes ? usage.file_size_bytes / (1024 ** 3) : 0;
  const percent = Math.min((usedGB / totalGB) * 100, 100);
  
  return {
    usedGB: usedGB.toFixed