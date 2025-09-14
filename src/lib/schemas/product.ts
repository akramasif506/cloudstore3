import { z } from 'zod';

export const updateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Title must be at least 3 characters long.'),
  description: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  originalPrice: z.coerce.number().positive('Original price must be a positive number.').optional(),
  category: z.string().nonempty('Please select a category.'),
  subcategory: z.string().nonempty('Please select a subcategory.'),
  condition: z.enum(['New', 'Like New', 'Used']),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.'),
  specialNote: z.string().optional(),
});
