import catering from "@/assets/service-catering.jpg";
import photography from "@/assets/service-photography.jpg";

export type MenuItem = {
  id: string;
  name: string;
  price: number; // INR per plate / unit
  category?: "starters" | "main" | "desserts" | "others";
};

export type PhotographyPackage = {
  id: string;
  name: string;
  price: number; // INR
  priceLabel?: string; // e.g. "/day"
  description: string;
};

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
  menu?: MenuItem[]; // for catering vendors
  packages?: PhotographyPackage[]; // for photography vendors
  experience?: string;
  location?: string;
  events?: string[];
  social?: string;
};

export const vendors: Vendor[] = [
  {
    id: "t02-catering",
    name: "T0.2 Catering",
    service: "catering",
    priceRange: "₹170 – ₹250 / plate",
    shortDescription:
      "Refined vegetarian and non-vegetarian catering crafted for weddings and celebrations across Dakshina Kannada.",
    description:
      "T0.2 Catering brings seven years of culinary craftsmanship to weddings, birthdays, and milestone celebrations. With a focus on flavour, presentation, and seamless service, the team curates menus that feel both familiar and elevated — built around your guest count, preferences, and the spirit of your event.",
    servicesIncluded: [
      "Vegetarian menu — ₹170 per plate",
      "Non-vegetarian menu — ₹250 per plate",
      "Starters, mains, desserts & beverages",
      "Trained service staff",
      "Custom menu planning",
      "Events across Dakshina Kannada",
    ],
    image: catering,
    gallery: [catering, catering, catering, catering],
    experience: "7 years",
    location: "Dakshina Kannada",
    events: ["Weddings", "Wedding-related events", "Birthdays"],
    social: "@t0.2testusername",
    menu: [
      { id: "s1", name: "Bla bla", price: 20, category: "starters" },
      { id: "s2", name: "Bla haa", price: 50, category: "starters" },
      { id: "m1", name: "Hu hu", price: 70, category: "main" },
      { id: "m2", name: "Ha ha", price: 110, category: "main" },
      { id: "d1", name: "Bottle", price: 10, category: "desserts" },
      { id: "d2", name: "This that", price: 50, category: "desserts" },
    ],
  },
  {
    id: "t03-photography",
    name: "T0.3 Photography",
    service: "photography",
    priceRange: "₹30,000 – ₹1,00,000",
    shortDescription:
      "Photography and videography for weddings, celebrations and corporate events across Dakshina Kannada and Udupi.",
    description:
      "T0.3 Photography brings a decade of experience capturing weddings, milestone celebrations and corporate moments across Dakshina Kannada and Udupi. From classic coverage to candid storytelling and full-scale videography, every package is built to preserve the atmosphere, emotion and detail of your day.",
    servicesIncluded: [
      "Wedding photography & videography",
      "Candid storytelling coverage",
      "Cinematic event films",
      "Corporate event coverage",
      "Edited high-resolution deliverables",
      "Coverage across DK & Udupi",
    ],
    image: photography,
    gallery: [photography, photography, photography, photography],
    experience: "10 years",
    location: "Dakshina Kannada & Udupi",
    events: ["Weddings", "Wedding-related events", "Birthdays", "Corporate events"],
    social: "@t0.3",
    packages: [
      {
        id: "basic",
        name: "Basic Photography",
        price: 20000,
        priceLabel: "/day",
        description:
          "Traditional photography coverage for your event with edited, high-resolution images delivered after the shoot.",
      },
      {
        id: "basic-candid",
        name: "Basic + Candid",
        price: 50000,
        priceLabel: "/day",
        description:
          "Traditional coverage paired with candid storytelling — capturing posed portraits alongside spontaneous, emotional moments.",
      },
      {
        id: "videography",
        name: "Videography",
        price: 80000,
        priceLabel: "/day",
        description:
          "Full cinematic video coverage of your event, professionally edited into a polished highlight film.",
      },
    ],
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
