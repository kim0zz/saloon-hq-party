import { supabase } from "@/integrations/supabase/client";

const YEAR = 60 * 60 * 24 * 365;

export async function uploadAndSign(bucket: "avatars" | "party-photos", file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(path, YEAR);
  if (sErr || !data) throw sErr ?? new Error("Nie udało się utworzyć podpisanego linku");
  return data.signedUrl;
}
