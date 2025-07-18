
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export type CategoryMap = { [key: string]: string[] };

// For now, this is hardcoded. In the future, this will fetch from Firebase.
const hardcodedCategories: CategoryMap = {
  'Furniture': ['Chairs', 'Tables', 'Shelving', 'Beds'],
  'Home Decor': ['Vases', 'Lamps', 'Rugs', 'Wall Art'],
  'Cloths': ['Jackets', 'Dresses', 'Shoes', 'Accessories'],
  'Electronics': ['Cameras', 'Audio', 'Computers', 'Phones'],
  'Outdoor & Sports': ['Bikes', 'Camping Gear', 'Fitness'],
  'Grocery': ['Snacks', 'Beverages', 'Pantry Staples'],
  'Other': ['Miscellaneous'],
};


export async function getCategories(): Promise<CategoryMap> {
  // In the future, we will replace this with a call to Firebase.
  // For now, it returns the hardcoded data.
  // const { db } = initializeAdmin();
  // const categoriesRef = db.ref('site_config/categories');
  // const snapshot = await categoriesRef.once('value');
  // if (snapshot.exists()) {
  //   return snapshot.val();
  // }
  return Promise.resolve(hardcodedCategories);
}
