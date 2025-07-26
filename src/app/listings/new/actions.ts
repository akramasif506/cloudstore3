
// src/app/listings/new/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { initializeAdmin } from '@/lib/firebase-admin';
import { listingSchema } from '@/lib/schemas';
import { getCurrentUser } from '@/lib/auth';
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
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'Authorization failed. Please log in and try again.' };
  }

  const { db } = initializeAdmin();
  const validatedFields = listingSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const productId = uuidv4();
    const displayId = await getNextProductId(db);
    const { productName, productDescription, ...restOfData } = validatedFields.data;

    const newProductData = {
      id: productId,
      displayId: displayId,
      name: productName,
      description: productDescription,
      price: restOfData.price,
      originalPrice: restOfData.originalPrice,
      category: restOfData.category,
      subcategory: restOfData.subcategory,
      condition: restOfData.condition,
      imageUrl: '', // Intentionally blank for now
      reviews: [],
      seller: {
        id: currentUser.id,
        name: currentUser.name || 'Unknown User',
        contactNumber: currentUser.mobileNumber || '',
      },
      createdAt: new Date().toISOString(),
      status: 'pending_image' as const, // New status for draft
    };

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
