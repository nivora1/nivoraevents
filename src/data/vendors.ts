import v1 from "@/assets/vendor-1.jpg";
import v2 from "@/assets/vendor-2.jpg";
import v3 from "@/assets/vendor-3.jpg";
import v4 from "@/assets/vendor-4.jpg";
import v5 from "@/assets/vendor-5.jpg";
import v6 from "@/assets/vendor-6.jpg";
import catering from "@/assets/service-catering.jpg";
import photography from "@/assets/service-photography.jpg";

export type Vendor = {
  id: string;
  name: string;
  service: "photography" | "catering";
  priceRange: string;
  shortDescription: string;
  description: string;
  servicesIncluded: string[];
  image: string;
  gallery: string[];
};

export const vendors: Vendor[] = [
  {
    id: "lumiere-studios",
    name: "Lumière Studios",
    service: "photography",
    priceRange: "₹60,000 – ₹1,20,000",
    shortDescription: "Editorial wedding storytelling with a cinematic touch.",
    description:
      "Lumière Studios crafts timeless wedding films and photography. With over a decade of experience covering destination and intimate weddings across India, the team blends documentary candor with editorial polish.",
    servicesIncluded: [
      "Full-day photography coverage",
      "Two lead photographers",
      "Online private gallery",
      "300+ edited high-resolution images",
      "Pre-wedding consultation",
    ],
    image: v1,
    gallery: [v1, v5, v3, v4],
  },
  {
    id: "candid-by-arjun",
    name: "Candid by Arjun",
    service: "photography",
    priceRange: "₹45,000 – ₹90,000",
    shortDescription: "Honest, joyful moments captured naturally.",
    description:
      "Arjun specializes in unscripted, emotion-led photography. Perfect for couples who value authenticity and warmth over staged shots.",
    servicesIncluded: [
      "8 hours of coverage",
      "Candid + traditional shots",
      "200+ edited images",
      "Highlight reel (60s)",
    ],
    image: v2,
    gallery: [v2, v6, v4, v1],
  },
  {
    id: "frameworks-india",
    name: "Frameworks India",
    service: "photography",
    priceRange: "₹80,000 – ₹1,50,000",
    shortDescription: "Premium full-service photography & cinematography.",
    description:
      "A 6-person creative crew offering premium coverage for multi-day Indian weddings — from haldi to reception. Drone, gimbal and studio-grade lighting included.",
    servicesIncluded: [
      "Multi-day coverage",
      "Drone aerial shots",
      "Cinematic wedding film",
      "Premium leather album",
    ],
    image: v3,
    gallery: [v3, v1, v5, v6],
  },
  {
    id: "vows-and-veils",
    name: "Vows & Veils",
    service: "photography",
    priceRange: "₹35,000 – ₹70,000",
    shortDescription: "Fine-art photography for intimate ceremonies.",
    description:
      "An award-winning duo focused on small, elegant weddings. Soft tones, natural light and gallery-worthy prints.",
    servicesIncluded: [
      "6 hours coverage",
      "Two photographers",
      "150+ edited images",
      "10×10 fine art album",
    ],
    image: v4,
    gallery: [v4, v2, v5, v1],
  },
  {
    id: "saffron-feast",
    name: "Saffron Feast",
    service: "catering",
    priceRange: "₹1,200 – ₹2,500 / plate",
    shortDescription: "Multi-cuisine catering with regional Indian specialties.",
    description:
      "Saffron Feast brings together master chefs from across India to create a memorable culinary experience for your guests. Live counters, plated dinners and bespoke menus available.",
    servicesIncluded: [
      "Custom menu planning",
      "Live counters & chaat stations",
      "Service staff and tableware",
      "Tasting session before event",
    ],
    image: catering,
    gallery: [catering, v3, v5, v1],
  },
  {
    id: "the-banquet-co",
    name: "The Banquet Co.",
    service: "catering",
    priceRange: "₹1,800 – ₹3,500 / plate",
    shortDescription: "Modern continental & fusion fine dining.",
    description:
      "A premium catering house specializing in plated fine-dining experiences. Ideal for cocktail evenings, receptions and intimate dinners.",
    servicesIncluded: [
      "Plated 5-course dinners",
      "Sommelier-paired beverages",
      "Premium glassware & linens",
      "Dedicated event captain",
    ],
    image: v3,
    gallery: [v3, catering, v6, v2],
  },
  {
    id: "spice-route",
    name: "Spice Route Caterers",
    service: "catering",
    priceRange: "₹900 – ₹1,800 / plate",
    shortDescription: "Authentic regional Indian cuisine, beautifully presented.",
    description:
      "From South Indian feasts to Mughlai banquets, Spice Route delivers authentic flavors with traditional presentation. Trusted by 500+ families.",
    servicesIncluded: [
      "Regional menu specialists",
      "Buffet & thali service",
      "Vegetarian and non-veg options",
      "On-site chefs",
    ],
    image: photography,
    gallery: [photography, catering, v5, v3],
  },
  {
    id: "verdant-table",
    name: "Verdant Table",
    service: "catering",
    priceRange: "₹1,500 – ₹2,800 / plate",
    shortDescription: "Farm-to-table seasonal menus & artisan grazing tables.",
    description:
      "A boutique caterer focused on seasonal, locally-sourced ingredients. Beautiful grazing tables, wood-fired stations and curated wine pairings.",
    servicesIncluded: [
      "Seasonal tasting menus",
      "Grazing & cheese tables",
      "Wood-fired live cooking",
      "Sustainable serveware",
    ],
    image: v6,
    gallery: [v6, catering, v4, v2],
  },
];

export const services = [
  {
    slug: "photography",
    title: "Photography",
    description: "Award-winning photographers and cinematographers.",
    image: photography,
  },
  {
    slug: "catering",
    title: "Catering",
    description: "Curated catering experiences for every palate.",
    image: catering,
  },
];
