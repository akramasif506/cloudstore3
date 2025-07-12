import type { StaticImageData } from "next/image";

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Review {
  id: string;
  user: User;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  imageUrl: string | StaticImageData;
  seller: User;
  reviews: Review[];
  distance: number; // in km
}
