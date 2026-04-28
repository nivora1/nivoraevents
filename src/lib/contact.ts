export const WHATSAPP_NUMBER = "919113292362";

export const VENDOR_APPLICATION_FORM_URL =
  "https://forms.gle/nCAbRLeVFvq7DbEz5";

export const buildBookingWhatsAppUrl = (
  vendorName: string,
  options?: { items?: string[]; total?: number }
) => {
  let text = `Hi, I'm interested in booking ${vendorName} for my event.`;
  if (options?.items && options.items.length > 0) {
    text += `\n\nSelected items: ${options.items.join(", ")}`;
    if (typeof options.total === "number") {
      text += `\nTotal price: ₹${options.total.toLocaleString("en-IN")}`;
    }
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
};
