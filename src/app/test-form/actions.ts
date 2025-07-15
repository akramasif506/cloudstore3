
'use server';

import { initializeAdmin } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function testUpload(
    formData: FormData
): Promise<{ success: boolean; message: string; }> {
    
    let storage;
    try {
        ({ storage } = initializeAdmin());
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Server configuration error: ${errorMessage}` };
    }

    const testField = formData.get('testField') as string;
    const imageFile = formData.get('imageFile') as File | null;

    if (!imageFile || imageFile.size === 0) {
        return { success: false, message: 'Image file is missing.' };
    }
     if (!testField) {
        return { success: false, message: 'Test field is missing.' };
    }

    try {
        // Convert the file to a buffer
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        
        // Create a unique file name
        const imageFileName = `${uuidv4()}-${imageFile.name}`;
        
        // Get a reference to the storage bucket
        const bucket = storage.bucket();
        
        // Upload the file to a 'test-uploads' folder
        const file = bucket.file(`test-uploads/${imageFileName}`);
        await file.save(imageBuffer, {
            metadata: { contentType: imageFile.type },
        });

        console.log(`Successfully uploaded ${imageFileName} to test-uploads folder.`);

        return { 
            success: true, 
            message: `Successfully uploaded "${imageFile.name}" for test field "${testField}".`
        };

    } catch (error) {
        console.error('Error in testUpload server action:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: `Upload failed: ${errorMessage}` };
    }
}
