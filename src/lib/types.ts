import type { StaticImageData } from "next/image";

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  role?: 'admin' | 'user';
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
  imageUrl: string;
  seller: User;
  reviews: Review[];
  distance: number; // in km
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}
