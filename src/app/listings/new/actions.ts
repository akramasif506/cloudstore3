
'use server';

import { z } from 'zod';
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, push, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { mockUser } from '@/lib/data'; // Using mock user as the seller for now
import { v4 as uuidv4 } from 'uuid';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';

export async function createListing(formData: FormData) {
  if (!db || !storage) {
    return { success: false, message: 'Firebase is not configured.' };
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

    // 1. Upload image to Firebase Storage
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const fileExtension = imageFile.name.split('.').pop();
    const imageFileName = `${uuidv4()}.${fileExtension}`;
    const uploadDate = new Date().toISOString().split('T')[0];
    
    const imageStoragePath = `CloudStor/upload/under_review/${uploadDate}/product/${category}/${imageFileName}`;
    const imageStorageRef = storageRef(storage, imageStoragePath);
    
    await uploadBytes(imageStorageRef, imageBuffer);
    const imageUrl = await getDownloadURL(imageStorageRef);

    // 2. Save product data to Realtime Database under the new path
    // The path will now be /products/{category}/{productId}
    const productsCategoryRef = dbRef(db, `products/${category}`);
    const newProductRef = push(productsCategoryRef); // Generate a unique key within the category
    const productId = newProductRef.key;

    if (!productId) {
        throw new Error("Failed to generate a new product ID.");
    }

    const newProduct = {
      ...validatedFields.data,
      id: productId,
      imageUrl: imageUrl,
      seller: {
        id: mockUser.id,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
      },
      reviews: [], 
      distance: Math.floor(Math.random() * 50) + 1,
      createdAt: new Date().toISOString(),
    };
    
    // Set the data at the specific path: /products/{category}/{productId}
    const productDbRef = dbRef(db, `products/${category}/${productId}`);
    await set(productDbRef, newProduct);

  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing.' };
  }

  redirect('/my-listings');
}
