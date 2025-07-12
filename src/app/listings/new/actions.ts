
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
    // 1. Upload image to Firebase Storage with the new path structure
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const fileExtension = imageFile.name.split('.').pop();
    const imageFileName = `${uuidv4()}.${fileExtension}`;
    
    const uploadDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const category = validatedFields.data.category;
    
    const imageStoragePath = `CloudStor/upload/under_review/${uploadDate}/product/${category}/${imageFileName}`;
    const imageStorageRef = storageRef(storage, imageStoragePath);
    
    await uploadBytes(imageStorageRef, imageBuffer);

    // 2. Get the public URL of the uploaded image
    const imageUrl = await getDownloadURL(imageStorageRef);

    // 3. Save product data to Realtime Database
    const productsRef = dbRef(db, 'products');
    const newProductRef = push(productsRef);

    const newProduct = {
      ...validatedFields.data,
      id: newProductRef.key,
      imageUrl: imageUrl,
      seller: {
        id: mockUser.id,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
      },
      reviews: [], // Start with no reviews
      distance: Math.floor(Math.random() * 50) + 1, // mock distance
      createdAt: new Date().toISOString(),
    };

    await set(newProductRef, newProduct);

  } catch (error) {
    console.error('Error creating listing:', error);
    return { success: false, message: 'Failed to create listing.' };
  }

  // This needs to be outside the try/catch, as redirect throws an error.
  redirect('/my-listings');
}
