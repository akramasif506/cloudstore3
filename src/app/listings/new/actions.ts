
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set, get, child } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';

export async function createListing(formData: FormData, userId: string) {
  if (!db || !storage) {
    return { success: false, message: 'Firebase is not configured.' };
  }

  if (!userId) {
    return { success: false, message: 'You must be logged in to create a listing.' };
  }

  // 1. Fetch user details from DB to ensure data is fresh and valid
  let user: User | null = null;
  try {
    const userSnapshot = await get(child(dbRef(db), `CloudStore/users/premium/${userId}`));
    if (userSnapshot.exists()) {
      user = userSnapshot.val() as User;
    } else {
      throw new Error("User profile not found in database.");
    }
  } catch (error) {
    console.error('Error fetching user for listing creation:', error);
    return { success: false, message: 'Could not verify your user account. Please try logging in again.' };
  }


  const rawFormData = Object.fromEntries(formData.entries());
  
  const validatedFields = listingSchema.safeParse({
    ...rawFormData,
    price: parseFloat(rawFormData.price as string),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data. Please check your inputs.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
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
    // 2. Upload image to Firebase Storage
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const imageStorageRef = storageRef(storage, `product-images/${imageFileName}`);
    
    await uploadBytes(imageStorageRef, imageBuffer);
    const imageUrl = await getDownloadURL(imageStorageRef);

    // 3. Prepare product data
    const newProductRef = push(dbRef(db, 'products'));
    const productId = newProductRef.key;

     if (!productId) {
        throw new Error("Failed to generate a new product ID.");
    }
    
    const newProductData = {
      ...validatedFields.data,
      id: productId,
      imageUrl: imageUrl,
      seller: {
        id: user.id,
        name: user.name,
        avatarUrl: user.profileImageUrl,
      },
      reviews: [], 
      distance: Math.floor(Math.random() * 50) + 1, // Placeholder
      createdAt: new Date().toISOString(),
      status: 'under_review', // All new products are under review
    };
    
    // 4. Save to the general 'products' path for easy querying
    await set(dbRef(db, `products/${productId}`), newProductData);

  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing.' };
  }

  redirect('/my-listings');
}
