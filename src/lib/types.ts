
export interface User {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  gender?: 'male' | 'female' | 'other';
  profileImageUrl: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  role?: 'admin' | 'user';
  createdAt: string;
}

export interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string;
  };
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
  reviews: Review[];
  status: 'active' | 'pending_review' | 'rejected' | 'sold';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}
