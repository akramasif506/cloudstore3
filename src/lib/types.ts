
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

export type Condition = 'New' | 'Like New' | 'Used';

export interface ProductSeller {
  id: string;
  name: string;
  contactNumber?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  imageUrl: string;
  condition?: Condition;
  reviews: Review[];
  status: 'active' | 'pending_review' | 'rejected' | 'sold' | 'pending_image';
  rejectionReason?: string;
  createdAt: string;
  seller: ProductSeller;
}

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    seller?: ProductSeller;
}

export interface Order {
    id:string;
    userId: string;
    customerName: string;
    items: OrderItem[];
    subtotal: number;
    platformFee: number;
    handlingFee: number;
    total: number;
    shippingAddress: string;
    contactNumber: string;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: string;
}

export interface FeeConfig {
    platformFeePercent: number;
    handlingFeeFixed: number;
}

export interface Category {
  name: string;
  imageUrl: string;
  productCount: number;
}
