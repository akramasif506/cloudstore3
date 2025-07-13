
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export interface AboutPageContent {
  title: string;
  description: string;
  imageUrl: string;
  mainContent: string;
}

const aboutPageSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  mainContent: z.string().min(20, 'Main content must be at least 20 characters.'),
});

const ABOUT_PAGE_PATH = 'site_config/about_page';

export async function getAboutPageContent(): Promise<AboutPageContent | null> {
    try {
        const { db } = initializeAdmin();
        const ref = db.ref(ABOUT_PAGE_PATH);
        const snapshot = await ref.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Error fetching about page content:", error);
        return null;
    }
}

export async function updateAboutPageContent(
  currentImageUrl: string,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  
  let db, storage;
  try {
    ({ db, storage } = initializeAdmin());
  } catch (error) {
    return { success: false, message: 'Server configuration error.' };
  }

  const formValues = {
    title: formData.get('title'),
    description: formData.get('description'),
    mainContent: formData.get('mainContent'),
  };

  const validatedFields = aboutPageSchema.safeParse(formValues);

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const imageFile = formData.get('imageUrl') as File | null;
  let newImageUrl = currentImageUrl;

  try {
    if (imageFile && imageFile.size > 0) {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const imageFileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
        const bucket = storage.bucket();
        const file = bucket.file(`site-assets/${imageFileName}`);

        await file.save(imageBuffer, {
            metadata: { contentType: imageFile.type },
        });

        [newImageUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491',
        });
    }

    const contentToSave: AboutPageContent = {
        ...validatedFields.data,
        imageUrl: newImageUrl,
    };
    
    const pageRef = db.ref(ABOUT_PAGE_PATH);
    await pageRef.set(contentToSave);

    revalidatePath('/about');
    revalidatePath('/dashboard/manage-about-page');

    return { success: true, message: 'About page content updated successfully!' };

  } catch (error) {
    console.error('Error updating about page:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update content: ${errorMessage}` };
  }
}
