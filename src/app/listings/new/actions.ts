
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set, get, child } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';

async function getCurrentUser(userId: string): Promise<User | null> {
  if (!db) return null;
  try {
    const userSnapshot = await get(child(dbRef(db), `CloudStore/users/premium/${userId}`));
    if (userSnapshot.exists()) {
      return userSnapshot.val() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function createListing(formData: FormData) {
  if (!db || !storage) {
    return { success: false, message: 'Firebase is not configured.' };
  }

  const userId = formData.get('userId') as string;

  if (!userId) {
    return { success: false, message: 'You must be logged in to create a listing.' };
  }

  const userProfile = await getCurrentUser(userId);
  if (!userProfile) {
    return { success: false, message: 'Could not find your user profile. Please try again.' };
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
    const { category } = validatedFields.data;
    const uploadDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 1. Upload image to Firebase Storage
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const fileExtension = imageFile.name.split('.').pop();
    const imageFileName = `${uuidv4()}.${fileExtension}`;
    
    const imageStoragePath = `CloudStor/upload/under_review/${uploadDate}/product/${category}/${imageFileName}`;
    const imageStorageRef = storageRef(storage, imageStoragePath);
    
    await uploadBytes(imageStorageRef, imageBuffer);
    const imageUrl = await getDownloadURL(imageStorageRef);

    // 2. Get a unique product ID for the database path
    const tempProductsRef = dbRef(db, 'products'); // Temporary ref to get a key
    const newProductRef = push(tempProductsRef);
    const productId = newProductRef.key;

    if (!productId) {
        throw new Error("Failed to generate a new product ID.");
    }
    
    // 3. Construct the new database path
    const newProductDbPath = `CloudStore/products/under_review/${uploadDate}/${category}/${productId}`;

    // 4. Prepare product data to be saved to Realtime Database
    const newProductData = {
      ...validatedFields.data,
      id: productId,
      imageUrl: imageUrl,
      seller: {
        id: userProfile.id,
        name: userProfile.name,
        avatarUrl: userProfile.profileImageUrl,
      },
      reviews: [], 
      distance: Math.floor(Math.random() * 50) + 1,
      createdAt: new Date().toISOString(),
      status: 'under_review',
    };
    
    // 5. Save product data to the specified path
    await set(dbRef(db, newProductDbPath), newProductData);

    // 6. Also save to the general `products` path for easier querying
    await set(dbRef(db, `products/${productId}`), newProductData);


  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing.' };
  }

  redirect('/my-listings');
}
