
// src/app/listings/new/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { initializeAdmin } from '@/lib/firebase-admin';
import { listingSchema } from '@/lib/schemas';

export async function createListing(
  userId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  
  // This check is essential for security.
  if (!userId) {
     return { success: false, message: `Authorization failed. Please log in and try again.` };
  }

  let db, storage;
  try {
    ({ db, storage } = initializeAdmin());
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Server configuration error: ${errorMessage}` };
  }

  // Create an object from the form data to be validated by Zod
  const formValues = Object.fromEntries(formData.entries());
  
  const validatedFields = listingSchema.safeParse(formValues);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const imageFile = formData.get('productImage') as File | null;
  if (!imageFile || imageFile.size === 0) {
    return {
      success: false,
      message: 'Product image is required.',
      errors: { productImage: ['Product image is required.'] },
    };
  }

  try {
    // Fetch seller details from the database using the provided and verified userId
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    if (!userSnapshot.exists()) {
        return { success: false, message: 'Seller profile not found.' };
    }
    const seller = userSnapshot.val();

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const bucket = storage.bucket();
    const file = bucket.file(`product-images/${imageFileName}`);

    await file.save(imageBuffer, {
      metadata: { contentType: imageFile.type },
    });

    const [imageUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // A far-future expiration date
    });

    const productId = uuidv4();

    const newProductData = {
      id: productId,
      name: validatedFields.data.productName,
      description: validatedFields.data.productDescription,
      price: validatedFields.data.price,
      category: validatedFields.data.category,
      subcategory: validatedFields.data.subcategory,
      condition: validatedFields.data.condition,
      imageUrl,
      reviews: [],
      seller: {
        id: userId,
        name: seller.name || 'Unknown User',
        contactNumber: seller.mobileNumber || ''
      },
      createdAt: new Date().toISOString(),
      status: 'pending_review',
    };

    const productRef = db.ref(`products/${productId}`);
    await productRef.set(newProductData);

    revalidatePath('/my-listings');
    revalidatePath('/dashboard/pending-products');


    return { success: true, message: "Listing submitted successfully!", productId: productId };
  } catch (error) {
    console.error('Error creating listing in server action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to create listing: ${errorMessage}` };
  }
}
