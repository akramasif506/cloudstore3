
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
  seller: {
    id: string;
    name: string;
  };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
}

export interface Order {
    id:string;
    userId: string;
    items: OrderItem[];
    total: number;
    shippingAddress: string;
    contactNumber: string;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: string;
}
