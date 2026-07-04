import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_vendors",
  title: "Search vendors",
  description:
    "Search approved Nivora vendors by keyword against name, description, and location.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Keyword to search"),
    service: z.enum(["photography", "catering"]).optional(),
    limit: z.number().int().min(1).max(50).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, service, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const like = `%${query.replace(/[%_]/g, "")}%`;
    let q = supabase
      .from("vendors")
      .select("id, vendor_name, service_type, price_range, short_description, location")
      .eq("status", "approved")
      .or(
        `vendor_name.ilike.${like},short_description.ilike.${like},description.ilike.${like},location.ilike.${like}`,
      )
      .limit(limit);
    if (service) q = q.eq("service_type", service);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
