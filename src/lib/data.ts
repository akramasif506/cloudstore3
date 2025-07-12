import type { User, Product } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Doe',
  avatarUrl: 'https://placehold.co/100x100',
  role: 'admin',
};

export const mockUsers: User[] = [
  mockUser,
];

export const mockProducts: Product[] = [];
