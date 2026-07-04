import { defineMcp } from "@lovable.dev/mcp-js";
import listVendors from "./tools/list-vendors";
import getVendor from "./tools/get-vendor";
import searchVendors from "./tools/search-vendors";

export default defineMcp({
  name: "nivora-mcp",
  title: "Nivora Wedding Vendors",
  version: "0.1.0",
  instructions:
    "Tools for browsing Nivora's wedding vendor marketplace. Use `search_vendors` to find vendors by keyword, `list_vendors` to browse by service (photography or catering), and `get_vendor` to fetch a specific vendor's packages, menu, and details.",
  tools: [listVendors, getVendor, searchVendors],
});
