import { supabase } from "@/integrations/supabase/client";

export type EventEntry = {
  name: string;
  dateType: "exact" | "tentative" | "flexible";
  date?: string; // ISO
};

export type WeddingProfile = {
  // Card 1
  partner1?: string;
  partner2?: string;
  phone?: string;
  email?: string;
  filledBy?: string;
  // Card 2
  weddingType?: string;
  community?: string;
  // Card 3
  events?: EventEntry[];
  // Card 4
  city?: string;
  state?: string;
  locationType?: "local" | "destination";
  destinationCity?: string;
  // Card 5
  booked?: string[];
  // Card 6
  styles?: string[];
  inspirationLinks?: string;
  // Card 7
  priorities?: string[];
  // Card 8
  notes?: string;
};

const LOCAL_KEY = "nivora_wedding_profile";

export const getLocalProfile = (): { data: WeddingProfile; completed: boolean } => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { data: {}, completed: false };
    return JSON.parse(raw);
  } catch {
    return { data: {}, completed: false };
  }
};

export const setLocalProfile = (data: WeddingProfile, completed: boolean) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ data, completed }));
};

export const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("wedding_profiles")
    .select("data, completed")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as { data: WeddingProfile; completed: boolean } | null;
};

export const upsertProfile = async (
  userId: string,
  data: WeddingProfile,
  completed: boolean
) => {
  const { error } = await supabase
    .from("wedding_profiles")
    .upsert(
      { user_id: userId, data: data as never, completed },
      { onConflict: "user_id" }
    );
  if (error) throw error;
};
