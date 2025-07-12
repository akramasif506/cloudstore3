
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import type { User } from '@/lib/types';

// userId is now optional
const listingActionSchema = listingSchema.extend({
  userId: z.string().optional(),
});


export async function createListing(formData: FormData) {
  if (!db || !storage) {
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
      id: 'cloudstore-anonymous',
      name: 'CloudStore',
  };

  // If a userId is provided, fetch the user data
  if (userId) {
      const userRef = dbRef(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const sellerData: User = userSnapshot.val();
        seller = {
            id: sellerData.id,
            name: sellerData.name || 'Anonymous User',
        }
      } else {
        // Log a warning but proceed with the default seller
        console.warn(`User with ID ${userId} not found, but listing creation is proceeding anonymously.`);
      }
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

  // Redirect to my-listings only if a user was logged in
  if (userId) {
    redirect('/my-listings');
  } else {
    // Or redirect to the homepage for anonymous users
    redirect('/');
  }
}
