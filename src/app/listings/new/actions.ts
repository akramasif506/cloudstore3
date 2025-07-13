// src/app/listings/new/actions.ts
'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import type { User } from '@/lib/types';
import { listingSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { initializeAdmin } from '@/lib/firebase-admin';

export async function createListing(
  formData: FormData
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  let db, storage, adminAuth;
  try {
    ({ db, storage, adminAuth } = initializeAdmin());
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Server configuration error: ${errorMessage}` };
  }

  // Final check to ensure a session cookie exists, providing a clear error if not.
  const session = cookies().get('session')?.value;
  if (!session) {
    return { success: false, message: 'Unauthorized: No session cookie found. Please log in again.' };
  }

  let decodedClaims;
  try {
    decodedClaims = await adminAuth.verifySessionCookie(session, true);
  } catch (error) {
    console.error("Error verifying session cookie in createListing:", error);
    return { success: false, message: 'Unauthorized: Your session is invalid. Please log in again.' };
  }

  const userId = decodedClaims.uid;
  
  const formValues = {
    productName: formData.get('productName'),
    productDescription: formData.get('productDescription'),
    price: formData.get('price'),
    category: formData.get('category'),
    subcategory: formData.get('subcategory'),
  };
  
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

  let seller: { id: string; name: string; };
  try {
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    if (userSnapshot.exists()) {
      const sellerData: User = userSnapshot.val();
      seller = { id: userId, name: sellerData.name || 'CloudStore User' };
    } else {
      console.warn(`User profile not found for UID: ${userId}.`);
      return { success: false, message: 'Could not find your user profile to create the listing.' };
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, message: 'Error fetching your user data.' };
  }

  try {
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
      imageUrl,
      reviews: [],
      seller,
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
