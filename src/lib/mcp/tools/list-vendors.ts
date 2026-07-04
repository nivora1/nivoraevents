import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_vendors",
  title: "List vendors",
  description:
    "List approved wedding vendors on Nivora, optionally filtered by service type (photography or catering).",
  inputSchema: {
    service: z
      .enum(["photography", "catering"])
      .optional()
      .describe("Filter by service type"),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ service, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("vendors")
      .select("id, vendor_name, service_type, price_range, short_description, location, experience")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (service) q = q.eq("service_type", service);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { vendors: data ?? [] },
    };
  },
});
