

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
    id:string;
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

export interface ProductVariant {
  name: string; // e.g., 'Color'
  value: string; // e.g., 'Red'
}

export interface Product {
  id: string;
  displayId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  imageUrl: string;
  condition?: Condition;
  reviews: Review[];
  status: 'active' | 'pending_review' | 'rejected' | 'sold' | 'pending_image';
  rejectionReason?: string;
  createdAt: string;
  seller: ProductSeller;
  variants?: ProductVariant[];
  stock?: number;
}

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    seller?: ProductSeller;
    category: string; // Add category to item for tax lookup
    subcategory: string; // Add subcategory to item for tax lookup
}

export type ReturnStatus = 'Return Requested' | 'Return Approved' | 'Return Rejected' | 'Returned' | 'Cancelled';

export interface Order {
    id: string; // Human-readable e.g., CS-1001
    internalId?: string; // The original UUID for internal linking
    userId: string;
    customerName: string;
    items: OrderItem[];
    subtotal: number;
    platformFee: number;
    handlingFee: number;
    tax: number; // Add tax field
    discount?: { name: string; value: number; } | null;
    total: number;
    shippingAddress: string;
    pinCode?: string;
    contactNumber: string;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    createdAt: string;
    returnStatus?: ReturnStatus;
    returnRequestId?: string;
    comments?: string;
}

export interface ReturnRequest {
    id: string;
    orderId: string; // This is the internal UUID
    userId: string;
    reason: string;
    requestedAt: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    order: Order; // Embed order snapshot for easy access
}


export interface FeeConfig {
    platformFeePercent: number;
    handlingFeeFixed: number;
}

export interface Discount {
  id: string;
  name: string;
  pincodes: string[];
  type: 'percentage' | 'fixed';
  value: number;
  enabled: boolean;
}

export type DiscountMap = { [id: string]: Omit<Discount, 'id'> };


export interface CategoryInfo {
  name: string;
  productCount: number;
}
