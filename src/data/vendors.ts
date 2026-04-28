import catering from "@/assets/service-catering.jpg";
import photography from "@/assets/service-photography.jpg";

export type MenuItem = {
  id: string;
  name: string;
  price: number; // INR per plate / unit
  category?: "starters" | "main" | "desserts" | "others";
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
