
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';

export async function createListing(formData: FormData) {
  if (!db || !storage) {
    return { success: false, message: 'Firebase is not configured.' };
  }

  const rawFormData = Object.fromEntries(formData.entries());
   const userId = rawFormData.userId as string;
   const userName = rawFormData.userName as string;
   const userAvatar = rawFormData.userAvatar as string;

  if (!userId) {
    return { success: false, message: 'You must be logged in to create a listing.' };
  }

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
    // 1. Upload image to Firebase Storage
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const imageStorageRef = storageRef(storage, `product-images/${imageFileName}`);
    
    await uploadBytes(imageStorageRef, imageBuffer);
    const imageUrl = await getDownloadURL(imageStorageRef);

    // 2. Prepare product data
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
        id: userId,
        name: userName,
        avatarUrl: userAvatar,
      },
      reviews: [], 
      distance: Math.floor(Math.random() * 50) + 1, // Placeholder
      createdAt: new Date().toISOString(),
      status: 'under_review', // All new products are under review
    };
    
    // 3. Save to the general 'products' path for easy querying
    await set(dbRef(db, `products/${productId}`), newProductData);

  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing.' };
  }

  redirect('/my-listings');
}
