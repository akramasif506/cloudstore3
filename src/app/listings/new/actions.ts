// src/app/listings/new/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { listingSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { initializeAdmin } from '@/lib/firebase-admin';

export async function createListing(
  formData: FormData
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  let db, storage;
  try {
    // We only need db and storage, not auth
    ({ db, storage } = initializeAdmin());
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Server configuration error: ${errorMessage}` };
  }

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

  // Hardcode a generic seller since validation is deferred to admin approval.
  const seller = { id: 'unauthenticated-user', name: 'CloudStore User' };

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
      seller, // Use the generic seller
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
