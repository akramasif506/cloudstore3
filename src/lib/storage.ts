
// src/lib/storage.ts
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

if (!storage) {
  console.warn("Firebase Storage is not initialized. File uploads will not work.");
}

/**
 * Uploads an image file to Firebase Storage and returns the public download URL.
 * This function is designed to be called from the client-side.
 * @param file The image file to upload.
 * @param userId The ID of the user uploading the file, used for folder organization.
 * @returns A promise that resolves with the public URL of the uploaded image.
 */
export async function uploadImageAndGetUrl(file: File, userId: string): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage is not available. Please check your configuration.");
  }
  if (!userId) {
      throw new Error("User must be authenticated to upload images.");
  }

  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `product-images/${userId}/${fileName}`);

  try {
    // Upload the file to the specified path
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the public URL of the uploaded file
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}
