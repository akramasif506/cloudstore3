import type { User, Product } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Doe',
  avatarUrl: 'https://placehold.co/100x100',
  role: 'admin',
};

export const mockUsers: User[] = [
  mockUser,
  { id: 'user-2', name: 'Jane Smith', avatarUrl: 'https://placehold.co/100x100', role: 'user' },
  { id: 'user-3', name: 'Sam Wilson', avatarUrl: 'https://placehold.co/100x100', role: 'user' },
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Vintage Leather Chair',
    description: 'A beautifully crafted mid-century modern leather chair. Perfect for any living room or office. Shows some signs of wear, which adds to its character.',
    price: 250,
    category: 'Furniture',
    subcategory: 'Chairs',
    imageUrl: 'https://placehold.co/600x400',
    seller: mockUsers[1],
    distance: 5,
    reviews: [
      { id: 'rev-1', user: mockUsers[0], rating: 5, comment: 'Absolutely stunning chair, even better in person!', date: '2023-10-10' },
      { id: 'rev-2', user: mockUsers[2], rating: 4, comment: 'Great find, but shipping was a bit slow.', date: '2023-10-12' },
    ],
  },
  {
    id: 'prod-2',
    name: 'Hand-painted Ceramic Vase',
    description: 'Unique, one-of-a-kind ceramic vase, hand-painted with intricate floral designs. A wonderful statement piece for your home decor.',
    price: 75,
    category: 'Home Decor',
    subcategory: 'Vases',
    imageUrl: 'https://placehold.co/600x400',
    seller: mockUsers[2],
    distance: 12,
    reviews: [],
  },
  {
    id: 'prod-3',
    name: 'Retro Bicycle',
    description: 'Classic 1980s 10-speed bicycle in great condition. Recently serviced with new tires and brakes. Ready to ride!',
    price: 180,
    category: 'Outdoor & Sports',
    subcategory: 'Bikes',
    imageUrl: 'https://placehold.co/600x400',
    seller: mockUsers[0],
    distance: 2,
    reviews: [
       { id: 'rev-3', user: mockUsers[1], rating: 5, comment: 'Rides like a dream! So happy with this purchase.', date: '2023-11-01' },
    ],
  },
    {
    id: 'prod-4',
    name: 'Designer Denim Jacket',
    description: 'A stylish and durable designer denim jacket. Barely worn, in excellent condition. Size medium.',
    price: 95,
    category: 'Apparel',
    subcategory: 'Jackets',
    imageUrl: 'https://placehold.co/600x400',
    seller: mockUsers[2],
    distance: 25,
    reviews: [],
  },
  {
    id: 'prod-5',
    name: 'Antique Wooden Bookshelf',
    description: 'Solid oak bookshelf from the early 1900s. Features intricate carvings and adjustable shelves. A timeless piece that offers ample storage.',
    price: 320,
    category: 'Furniture',
    subcategory: 'Shelving',
    imageUrl: 'https://placehold.co/600x400',
    seller: mockUsers[1],
    distance: 8,
    reviews: [
        { id: 'rev-4', user: mockUsers[0], rating: 5, comment: 'Sturdy and beautiful, exactly as described.', date: '2023-10-20' },
    ],
  },
  {
    id: 'prod-6',
    name: 'Vintage Film Camera',
    description: 'A classic 35mm film camera from the 1970s. Fully functional and comes with a leather case and original manual. Great for photography enthusiasts.',
    price: 150,
    category: 'Electronics',
    subcategory: 'Cameras',
    imageUrl: 'https://placehold.co/600x400',
    seller: mockUsers[0],
    distance: 15,
    reviews: [
       { id: 'rev-5', user: mockUsers[2], rating: 4, comment: 'Works well, a few scratches but that was expected.', date: '2023-11-05' },
    ],
  },
];
