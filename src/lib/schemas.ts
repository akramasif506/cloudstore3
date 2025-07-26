import { z } from 'zod';

const variantSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const listingSchema = z.object({
  productName: z.string().min(3, 'Title must be at least 3 characters long.'),
  productDescription: z.string().min(10, 'Description must be at least 10 characters long.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  originalPrice: z.coerce.number().positive('Original price must be a positive number.').optional(),
  category: z.string().nonempty('Please select a category.'),
  subcategory: z.string().nonempty('Please select a subcategory.'),
  condition: z.enum(['New', 'Like New', 'Used'], {
    required_error: 'Please select the item condition.',
  }),
  variants: z.array(variantSchema).optional(),
});
