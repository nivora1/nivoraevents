export type VendorPackage = {
  id: string;
  name: string;
  priceRange: string;
  description: string;
};

export type VendorApplication = {
  vendorName: string;
  description: string;
  serviceType: "photography" | "catering" | "";
  images: string[]; // data URLs
  packages: VendorPackage[];
  submittedAt?: string;
};

const STORAGE_KEY = "nivora_vendor_application";

export const emptyApplication = (): VendorApplication => ({
  vendorName: "",
  description: "",
  serviceType: "",
  images: [],
  packages: [
    { id: crypto.randomUUID(), name: "", priceRange: "", description: "" },
  ],
});

export const saveApplication = (app: VendorApplication) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
};

export const loadApplication = (): VendorApplication | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VendorApplication;
  } catch {
    return null;
  }
};

export const clearApplication = () => {
  localStorage.removeItem(STORAGE_KEY);
};
