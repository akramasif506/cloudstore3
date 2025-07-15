
// src/app/listings/new/actions.ts
'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { initializeAdmin } from '@/lib/firebase-admin';
import { listingSchema } from '@/lib/schemas';
import { getCurrentUser } from '@/lib/auth';

// Server-side schema doesn't include the file, only the text fields.
const serverListingSchema = listingSchema.pick({
    productName: true,
    productDescription: true,
    price: true,
    category: true,
    subcategory: true,
    condition: true,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


export async function createListing(
  formData: FormData
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  
  const currentUser = await getCurrentUser();
  if (!currentUser) {
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

  const formValues = {
    productName: formData.get('productName'),
    productDescription: formData.get('productDescription'),
    price: Number(formData.get('price')),
    category: formData.get('category'),
    subcategory: formData.get('subcategory'),
    condition: formData.get('condition'),
  };
  
  const validatedFields = serverListingSchema.safeParse(formValues);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data received on server.',
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

  // --- Server-side image validation ---
  if (imageFile.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: 'File size exceeds the 5MB limit.',
      errors: { productImage: ['File is too large. Maximum size is 5MB.'] }
    }
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(imageFile.type)) {
     return {
      success: false,
      message: 'Invalid file type.',
      errors: { productImage: ['Only .jpg, .jpeg, .png and .webp formats are supported.'] }
    }
  }
  // --- End of validation ---


  try {
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const bucket = storage.bucket();
    const file = bucket.file(`product-images/${imageFileName}`);
    
    // --- Use a stream to upload the file to prevent timeouts ---
    const fileStream = file.createWriteStream({
        metadata: { contentType: imageFile.type },
    });

    await new Promise((resolve, reject) => {
        const nodeStream = imageFile.stream();
        nodeStream.pipe(fileStream)
            .on('finish', resolve)
            .on('error', reject);
    });
    // --- End of stream logic ---

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
      condition: validatedFields.data.condition,
      imageUrl,
      reviews: [],
      seller: {
        id: currentUser.id,
        name: currentUser.name || 'Unknown User',
        contactNumber: currentUser.mobileNumber || ''
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
