
// src/app/listings/new/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { initializeAdmin } from '@/lib/firebase-admin';
import { listingSchema } from '@/lib/schemas';
import { ref, set, update } from 'firebase/database';


async function getNextProductId(db: any): Promise<string> {
  const counterRef = db.ref('site_config/product_counter');
  const result = await counterRef.transaction((currentValue: number | null) => {
    if (currentValue === null) {
      return 1001; // Starting value
    }
    return currentValue + 1;
  });

  if (!result.committed) {
    throw new Error('Failed to generate a new product ID. Please try again.');
  }
  
  const newProductNumber = result.snapshot.val();
  return `PID-${newProductNumber}`;
}

/**
 * Action 1: Creates a new product listing as a draft without an image.
 * This is the first step in the new two-step submission process.
 */
export async function createListingDraft(
  values: z.infer<typeof listingSchema>
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  
  const validatedFields = listingSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { db } = initializeAdmin();

  try {
    const productId = uuidv4();
    const displayId = await getNextProductId(db);
    const { productName, productDescription, seller, ...restOfData } = validatedFields.data;

    const newProductData: any = {
      id: productId,
      displayId: displayId,
      name: productName,
      description: productDescription,
      price: restOfData.price,
      category: restOfData.category,
      subcategory: restOfData.subcategory,
      condition: restOfData.condition,
      stock: restOfData.stock,
      imageUrl: '', // Intentionally blank for now
      reviews: [],
      seller: {
        id: seller.id,
        name: seller.name,
        contactNumber: seller.contactNumber,
      },
      createdAt: new Date().toISOString(),
      status: 'pending_image' as const,
    };
    
    // Conditionally add optional fields to avoid saving 'undefined'
    if (restOfData.originalPrice) {
        newProductData.originalPrice = restOfData.originalPrice;
    }
    if (restOfData.variants && restOfData.variants.length > 0) {
        newProductData.variants = restOfData.variants;
    }
    if (restOfData.specifications && restOfData.specifications.length > 0) {
        newProductData.specifications = restOfData.specifications;
    }


    const productRef = ref(db, `products/${productId}`);
    await set(productRef, newProductData);

    return { success: true, message: 'Draft saved successfully!', productId: productId };
  } catch (error) {
    console.error('Error creating listing draft:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to save draft: ${errorMessage}` };
  }
}

/**
 * Action 2: Updates an existing product with the image URL and sets its status for review.
 * This is the second step in the submission process.
 */
export async function finalizeListing(
    productId: string,
    imageUrl: string,
): Promise<{ success: boolean; message: string; }> {
    const { db } = initializeAdmin();
    
    try {
        const productRef = ref(db, `products/${productId}`);
        await update(productRef, {
            imageUrl: imageUrl,
            status: 'pending_review'
        });

        // Revalidate paths to show the new listing in relevant places
        revalidatePath('/my-listings');
        revalidatePath('/dashboard/pending-products');

        return { success: true, message: 'Listing submitted successfully!' };
    } catch (error) {
        console.error('Error finalizing listing:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Failed to finalize listing: ${errorMessage}` };
    }
}
