import { z } from 'zod';

export const listingSchema = z.object({
  productName: z.string().min(3, 'Title must be at least 3 characters long.'),
  productDescription: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  category: z.string().nonempty('Please select a category.'),
  subcategory: z.string().nonempty('Please select a subcategory.'),
  // User fields are now optional
  userId: z.string().optional(),
  userName: z.string().optional(),
  userAvatarUrl: z.string().url().or(z.literal('')).optional(),
});
