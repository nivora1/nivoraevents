import catering from "@/assets/service-catering.jpg";
import photography from "@/assets/service-photography.jpg";

export type MenuItem = {
  id: string;
  name: string;
  price: number; // INR per plate / unit
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
};

// No vendors yet — listings will populate as real vendors are onboarded.
export const vendors: Vendor[] = [];

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
