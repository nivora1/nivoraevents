export const WHATSAPP_NUMBER = "919113292362";

export const buildBookingWhatsAppUrl = (vendorName: string) => {
  const msg = encodeURIComponent(
    `Hi, I'm interested in booking ${vendorName} for my event.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
};
