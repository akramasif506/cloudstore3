
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export interface PromoBanner {
  imageUrl: string;
  link: string | null;
}

const promoBannerSchema = z.object({
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

const PROMO_BANNER_PATH = 'site_config/promo_banner';

export async function getPromoBanner(): Promise<PromoBanner | null> {
    try {
        const { db } = initializeAdmin();
        const ref = db.ref(PROMO_BANNER_PATH);
        const snapshot = await ref.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Error fetching promo banner content:", error);
        return null;
    }
}

export async function updatePromoBanner(
  currentImageUrl: string | null,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  
  let db, storage;
  try {
    ({ db, storage } = initializeAdmin());
  } catch (error) {
    return { success: false, message: 'Server configuration error.' };
  }

  const formValues = {
    link: formData.get('link'),
  };

  const validatedFields = promoBannerSchema.safeParse(formValues);

  if (!validatedFields.success) {
    return { success: false, message: 'Invalid form data.' };
  }

  const imageFile = formData.get('image') as File | null;
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

    if (!newImageUrl) {
        return { success: false, message: 'An image is required to set the banner.' };
    }

    const contentToSave: PromoBanner = {
        imageUrl: newImageUrl,
        link: validatedFields.data.link || null,
    };
    
    const bannerRef = db.ref(PROMO_BANNER_PATH);
    await bannerRef.set(contentToSave);

    revalidatePath('/');
    revalidatePath('/dashboard/manage-promo-banner');

    return { success: true, message: 'Promotional banner updated successfully!' };

  } catch (error) {
    console.error('Error updating promo banner:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update banner: ${errorMessage}` };
  }
}


export async function clearPromoBanner(): Promise<{ success: boolean; message: string }> {
  const { db } = initializeAdmin();
  try {
    const bannerRef = db.ref(PROMO_BANNER_PATH);
    await bannerRef.remove();
    
    revalidatePath('/');
    revalidatePath('/dashboard/manage-promo-banner');
    
    return { success: true, message: 'Promotional banner has been cleared.' };
  } catch (error) {
    console.error('Error clearing promo banner:', error);
    return { success: false, message: 'Failed to clear banner.' };
  }
}

