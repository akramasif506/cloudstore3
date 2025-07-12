
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Make sure auth is imported

export async function createListing(formData: FormData) {
  if (!db || !storage || !auth) {
    return { success: false, message: 'Firebase is not configured.' };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to create a listing.' };
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
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const imageStorageRef = storageRef(storage, `product-images/${imageFileName}`);
    
    await uploadBytes(imageStorageRef, imageBuffer);
    const imageUrl = await getDownloadURL(imageStorageRef);
    
    const productId = uuidv4();
    const { productName, productDescription, price, category, subcategory } = validatedFields.data;

    const newProductData = {
      id: productId,
      name: productName,
      description: productDescription,
      price,
      category,
      subcategory,
      imageUrl: imageUrl,
      reviews: [], 
      seller: {
        id: currentUser.uid,
        name: currentUser.displayName || 'Anonymous User',
      },
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
