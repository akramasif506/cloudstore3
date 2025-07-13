// src/app/listings/new/actions.ts
'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import type { User } from '@/lib/types';
import { listingSchema } from '@/lib/schemas';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const clientListingSchema = listingSchema.extend({
  productImage: z.any(),
});

export async function createListing(
  values: z.infer<typeof clientListingSchema>
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  let adminAuth, db, storage;
  try {
    const adminApp = initializeAdmin();
    adminAuth = adminApp.adminAuth;
    db = adminApp.db;
    storage = adminApp.storage;
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Server configuration error: ${errorMessage}` };
  }

  const session = cookies().get('session')?.value;
  if (!session) {
    return { success: false, message: 'Unauthorized: No session cookie found.' };
  }

  let decodedClaims;
  try {
    decodedClaims = await adminAuth.verifySessionCookie(session, true);
  } catch (error) {
    return { success: false, message: 'Unauthorized: Invalid session cookie.' };
  }

  const userId = decodedClaims.uid;
  
  const validatedFields = listingSchema.safeParse({
    productName: values.productName,
    productDescription: values.productDescription,
    price: values.price,
    category: values.category,
    subcategory: values.subcategory,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const imageFile = values.productImage as File | null;
  if (!imageFile || imageFile.size === 0) {
    return {
      success: false,
      message: 'Product image is required.',
      errors: { productImage: ['Product image is required.'] },
    };
  }

  let seller = { id: 'anonymous', name: 'Anonymous Seller' };
  try {
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    if (userSnapshot.exists()) {
      const sellerData: User = userSnapshot.val();
      seller = { id: sellerData.id, name: sellerData.name || 'User' };
    } else {
      return { success: false, message: 'Could not find user profile.' };
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, message: 'Error fetching user data.' };
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
      expires: '03-09-2491',
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

    return { success: true, message: "Listing submitted successfully!", productId: productId };
  } catch (error) {
    console.error('Error creating listing in server action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to create listing: ${errorMessage}` };
  }
}
