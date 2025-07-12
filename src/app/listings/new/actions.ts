
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { ref as dbRef, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';

// This action now requires a userId
const listingActionSchema = listingSchema.extend({
  userId: z.string().min(1, { message: 'User must be logged in.' }),
});


export async function createListing(formData: FormData) {
  if (!db || !storage || !adminDb) {
    return { success: false, message: 'Firebase is not configured.' };
  }
  
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = listingActionSchema.safeParse({
    ...rawFormData,
    price: parseFloat(rawFormData.price as string),
  });

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Invalid form data. Please check your inputs.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { userId, productName, productDescription, price, category, subcategory } = validatedFields.data;

  let seller = {
      id: 'anonymous',
      name: 'Anonymous Seller',
  };

  // Fetch the user data to use as the seller using the admin SDK to bypass security rules
  const userRef = adminDb.ref(`users/${userId}`);
  const userSnapshot = await userRef.once('value');

  if (userSnapshot.exists()) {
    const sellerData: User = userSnapshot.val();
    seller = {
        id: sellerData.id,
        name: sellerData.name || 'User',
    }
  } else {
    // This is a critical error, the user must exist in the DB to create a listing.
    return { success: false, message: 'Could not find user profile. Please try logging in again.' };
  }
  
  const imageFile = formData.get('productImage') as File;
  if (!imageFile || imageFile.size === 0) {
    return { 
        success: false, 
        message: 'Product image is required.',
        errors: { productImage: ['Product image is required.'] } 
    };
  }

  try {
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const imageStorageRef = storageRef(storage, `product-images/${imageFileName}`);
    
    await uploadBytes(imageStorageRef, imageBuffer);
    const imageUrl = await getDownloadURL(imageStorageRef);
    
    const productId = uuidv4();
    
    const newProductData = {
      id: productId,
      name: productName,
      description: productDescription,
      price,
      category,
      subcategory,
      imageUrl: imageUrl,
      reviews: [], 
      seller: seller,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
    };
    
    await set(dbRef(db, `products/${productId}`), newProductData);

  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing.' };
  }

  redirect('/my-listings');
}
