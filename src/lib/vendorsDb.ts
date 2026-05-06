import { supabase } from "@/integrations/supabase/client";
import type { Vendor, PhotographyPackage } from "@/data/vendors";

const fallbackImg = "/placeholder.svg";

export const dbRowToVendor = (row: any): Vendor => {
  const images = Array.isArray(row.images) ? (row.images as string[]) : [];
  const gallery = images.length > 0 ? images : [fallbackImg];
  const packages: PhotographyPackage[] = Array.isArray(row.packages)
    ? (row.packages as any[]).map((p: any) => ({
        id: p.id || crypto.randomUUID(),
        name: p.name || "",
        price: typeof p.price === "number" ? p.price : 0,
        priceText: p.priceRange || p.priceText || undefined,
        priceLabel: p.priceLabel,
        description: p.description || "",
      }))
    : [];
  return {
    id: row.id,
    name: row.vendor_name,
    service: row.service_type,
    priceRange: row.price_range || "",
    shortDescription: row.short_description || "",
    description: row.description || "",
    servicesIncluded: Array.isArray(row.services_included) ? row.services_included : [],
    image: gallery[0],
    gallery,
    packages,
    menu: Array.isArray(row.menu) ? row.menu : [],
    experience: row.experience || undefined,
    location: row.location || undefined,
    events: Array.isArray(row.events) ? row.events : [],
    social: row.social || undefined,
  };
};

export const fetchApprovedVendors = async (
  service?: "photography" | "catering"
): Promise<Vendor[]> => {
  let q = supabase.from("vendors").select("*").eq("status", "approved").order("created_at", { ascending: false });
  if (service) q = q.eq("service_type", service);
  const { data, error } = await q;
  if (error) {
    console.error("fetchApprovedVendors error", error);
    return [];
  }
  return (data ?? []).map(dbRowToVendor);
};

export const fetchVendorById = async (id: string): Promise<Vendor | null> => {
  const { data, error } = await supabase.from("vendors").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return dbRowToVendor(data);
};
