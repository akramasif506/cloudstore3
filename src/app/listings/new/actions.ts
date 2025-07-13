// src/app/listings/new/actions.ts
'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

import type { User } from '@/lib/types';
import { listingSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

function initializeAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK credentials are not defined in environment variables.');
  }

  if (admin.apps.length > 0) {
    return {
      adminAuth: admin.auth(),
      db: admin.database(),
      storage: admin.storage(),
    };
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return {
    adminAuth: app.auth(),
    db: app.database(),
    storage: app.storage(),
  };
}


export async function createListing(
  formData: FormData
): Promise<{ success: boolean; message: string; productId?: string; errors?: any }> {
  let adminAuth, db, storage;
  try {
    const adminApp = initializeAdmin();
    adminAuth = adminApp.adminAuth;
    db = adminApp.db;
    storage = adminApp.storage;
  } catch (error) {
    console.error("Firebase Admin Init Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Server configuration error: ${errorMessage}` };
  }

  const session = cookies().get('session')?.value;
  if (!session) {
    return { success: false, message: 'Unauthorized: No session cookie found.' };
  }

  let decodedClaims;
  try {
    decodedClaims = await adminAuth.verifySessionCookie(session, true);
  } catch (error) {
    return { success: false, message: 'Unauthorized: Invalid session cookie.' };
  }

  const userId = decodedClaims.uid;
  
  const formValues = {
    productName: formData.get('productName'),
    productDescription: formData.get('productDescription'),
    price: formData.get('price'),
    category: formData.get('category'),
    subcategory: formData.get('subcategory'),
  };
  
  const validatedFields = listingSchema.safeParse(formValues);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form data.',
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

  let seller = { id: 'anonymous', name: 'Anonymous Seller' };
  try {
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    if (userSnapshot.exists()) {
      const sellerData: User = userSnapshot.val();
      seller = { id: sellerData.id, name: sellerData.name || 'User' };
    } else {
      return { success: false, message: 'Could not find user profile.' };
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, message: 'Error fetching user data.' };
  }

  try {
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const bucket = storage.bucket();
    const file = bucket.file(`product-images/${imageFileName}`);

    await file.save(imageBuffer, {
      metadata: { contentType: imageFile.type },
    });

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
      imageUrl,
      reviews: [],
      seller,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
    };

    const productRef = db.ref(`products/${productId}`);
    await productRef.set(newProductData);

    revalidatePath('/my-listings');

    return { success: true, message: "Listing submitted successfully!", productId: productId };
  } catch (error) {
    console.error('Error creating listing in server action:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to create listing: ${errorMessage}` };
  }
}
