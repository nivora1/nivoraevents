import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY = "nivora_event_plan_local";

export const getLocalPlan = (): string[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const setLocalPlan = (ids: string[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
};

export const getOrCreatePlanRow = async (userId: string) => {
  const { data: existing } = await supabase
    .from("event_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing;
  const { data: created, error } = await supabase
    .from("event_plans")
    .insert({ user_id: userId, name: "My Event Plan", vendor_ids: [] })
    .select("*")
    .single();
  if (error) throw error;
  return created;
};

export const savePlanVendors = async (userId: string, vendorIds: string[]) => {
  const row = await getOrCreatePlanRow(userId);
  const { error } = await supabase
    .from("event_plans")
    .update({ vendor_ids: vendorIds })
    .eq("id", row.id);
  if (error) throw error;
};
