
import { z } from 'zod';

const variantSchema = z.object({
  name: z.string(),
  value: z.string(),
});

const specificationSchema = z.object({
  key: z.string().min(1, 'Specification key cannot be empty.'),
  value: z.string().min(1, 'Specification value cannot be empty.'),
});

const sellerSchema = z.object({
    id: z.string(),
    name: z.string(),
    contactNumber: z.string(),
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
  stock: z.coerce.number().int().min(1, 'Stock must be at least 1.').default(1),
  variants: z.array(variantSchema).optional(),
  specifications: z.array(specificationSchema).optional(),
  seller: sellerSchema, // Add seller to the schema
});
