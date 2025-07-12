
'use server';

import { z } from 'zod';
import { auth, db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set, get, child } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';

async function getCurrentUser(userId: string): Promise<User | null> {
  if (!db) return null;
  try {
    const userSnapshot = await get(child(dbRef(db), `users/${userId}`));
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
  if (!db || !storage || !auth) {
    return { success: false, message: 'Firebase is not configured.' };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to create a listing.' };
  }

  const userProfile = await getCurrentUser(currentUser.uid);
  if (!userProfile || !userProfile.mobileNumber) {
    return { success: false, message: 'User mobile number not found. Please update your profile.' };
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
    const userMobile = userProfile.mobileNumber;

    // 1. Upload image to Firebase Storage
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const fileExtension = imageFile.name.split('.').pop();
    const imageFileName = `${uuidv4()}.${fileExtension}`;
    
    // The storage path can remain generic as it's for internal organization
    const imageStoragePath = `uploads/${uploadDate}/${category}/${imageFileName}`;
    const imageStorageRef = storageRef(storage, imageStoragePath);
    
    await uploadBytes(imageStorageRef, imageBuffer);
    const imageUrl = await getDownloadURL(imageStorageRef);

    // 2. Prepare database path and get a unique product ID
    const productDbPath = `${userMobile}/${uploadDate}/${category}`;
    const newProductRef = push(dbRef(db, productDbPath));
    const productId = newProductRef.key;

    if (!productId) {
        throw new Error("Failed to generate a new product ID.");
    }

    // 3. Prepare product data to be saved to Realtime Database
    const newProduct = {
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
    
    // 4. Save product data to the new structured path in Realtime Database
    await set(newProductRef, newProduct);

  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing.' };
  }

  redirect('/my-listings');
}
