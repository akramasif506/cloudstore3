
// src/app/listings/new/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { initializeAdmin } from '@/lib/firebase-admin';
import { listingSchema } from '@/lib/schemas';
import { getCurrentUser } from '@/lib/auth';

// This is the shape of the data the server action now expects.
// It does NOT include the productImage file, only the final URL.
const serverListingSchema = listingSchema.extend({
    imageUrl: z.string().url(),
    price: z.coerce.number().positive('Price must be a positive number.'),
});

type ServerListingData = z.infer<typeof serverListingSchema>;

export async function createListing(
  values: ServerListingData
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  
  const currentUser = await getCurrentUser();
  if (!currentUser) {
     return { success: false, message: `Authorization failed. Please log in and try again.` };
  }
  
  let db;
  try {
    ({ db } = initializeAdmin());
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Server configuration error: ${errorMessage}` };
  }
  
  const validatedFields = serverListingSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data received on server.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const productId = uuidv4();

    // Destructure using the correct field names from the schema
    const { productName, productDescription, ...restOfData } = validatedFields.data;

    const newProductData = {
      id: productId,
      name: productName,
      description: productDescription,
      ...restOfData,
      reviews: [],
      seller: {
        id: currentUser.id,
        name: currentUser.name || 'Unknown User',
        contactNumber: currentUser.mobileNumber || ''
      },
      createdAt: new Date().toISOString(),
      status: 'pending_review', // Listings should always be pending review
    };

    const productRef = db.ref(`products/${productId}`);
    await productRef.set(newProductData);

    // Revalidate paths to show the new listing in relevant places
    revalidatePath('/my-listings');
    revalidatePath('/dashboard/pending-products');

    return { success: true, message: "Listing submitted successfully!", productId: productId };
  } catch (error) {
    console.error('Error creating listing in server action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to create listing: ${errorMessage}` };
  }
}
