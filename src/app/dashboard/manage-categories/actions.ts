
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export type CategoryMap = { [key: string]: string[] };

const CATEGORIES_PATH = 'site_config/categories';

export async function getCategories(): Promise<CategoryMap> {
  try {
    const { db } = initializeAdmin();
    const categoriesRef = db.ref(CATEGORIES_PATH);
    const snapshot = await categoriesRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching categories from Firebase:", error);
  }
  // Return a default structure if nothing is found in the DB
  return {
    'Furniture': ['Chairs', 'Tables', 'Shelving', 'Beds'],
    'Home Decor': ['Vases', 'Lamps', 'Rugs', 'Wall Art'],
    'Cloths': ['Jackets', 'Dresses', 'Shoes', 'Accessories'],
    'Electronics': ['Cameras', 'Audio', 'Computers', 'Phones'],
  };
}

export async function saveCategories(
  categories: CategoryMap
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = initializeAdmin();
    const categoriesRef = db.ref(CATEGORIES_PATH);
    await categoriesRef.set(categories);

    // Revalidate paths that use categories
    revalidatePath('/listings/new');
    revalidatePath('/'); // For filters
    revalidatePath('/dashboard/manage-categories');

    return { success: true, message: 'Categories have been saved successfully!' };
  } catch (error) {
    console.error("Error saving categories to Firebase:", error);
    return { success: false, message: 'Failed to save categories.' };
  }
}
