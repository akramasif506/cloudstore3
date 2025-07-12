
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import admin from 'firebase-admin';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/lib/types';
import { listingSchema } from '@/lib/schemas';

// --- Firebase Admin Initialization ---
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

// --- Zod Schema for validation ---
const apiListingSchema = listingSchema.extend({
  productImage: z.instanceof(File),
});

// --- API Route Handler ---
export async function POST(request: NextRequest) {
  let adminAuth, db, storage;
  
  try {
    const adminApp = initializeAdmin();
    adminAuth = adminApp.adminAuth;
    db = adminApp.db;
    storage = adminApp.storage;
  } catch (error) {
     console.error("Firebase Admin Init Error:", error);
     return NextResponse.json({ message: "Server configuration error." }, { status: 500 });
  }

  const session = cookies().get('session')?.value;
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized: No session cookie found.' }, { status: 401 });
  }

  let decodedClaims;
  try {
    decodedClaims = await adminAuth.verifySessionCookie(session, true);
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized: Invalid session cookie.' }, { status: 401 });
  }

  const userId = decodedClaims.uid;
  const formData = await request.formData();
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = listingSchema.safeParse({
    ...rawFormData,
    price: parseFloat(rawFormData.price as string),
  });

  if (!validatedFields.success) {
    return NextResponse.json({ 
        message: 'Invalid form data.',
        errors: validatedFields.error.flatten().fieldErrors
    }, { status: 400 });
  }
  
  const imageFile = formData.get('productImage') as File | null;
  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ 
        message: 'Product image is required.',
        errors: { productImage: ['Product image is required.'] } 
    }, { status: 400 });
  }


  let seller = { id: 'anonymous', name: 'Anonymous Seller' };
  try {
    const userRef = db.ref(`users/${userId}`);
    const userSnapshot = await userRef.once('value');
    if (userSnapshot.exists()) {
        const sellerData: User = userSnapshot.val();
        seller = { id: sellerData.id, name: sellerData.name || 'User' };
    } else {
        return NextResponse.json({ message: 'Could not find user profile.' }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ message: 'Error fetching user data.' }, { status: 500 });
  }


  try {
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
    const bucket = storage.bucket();
    const file = bucket.file(`product-images/${imageFileName}`);
    
    await file.save(imageBuffer, {
        metadata: { contentType: imageFile.type }
    });

    const [imageUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
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

    return NextResponse.json({ success: true, productId: productId }, { status: 201 });

  } catch (error) {
    console.error('Error creating listing in API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Failed to create listing: ${errorMessage}` }, { status: 500 });
  }
}
