import { supabase } from "@/integrations/supabase/client";

const KEY = "saloon_admin_ok";

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}
export function lockAdmin() {
  localStorage.removeItem(KEY);
}
export async function tryAdminPin(pin: string): Promise<boolean> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "admin_pin").maybeSingle();
  const stored = data?.value ?? "1234";
  const ok = pin === stored;
  if (ok) localStorage.setItem(KEY, "1");
  return ok;
}
