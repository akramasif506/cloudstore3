
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export interface Subcategory {
  name: string;
  enabled: boolean;
}

export interface VariantAttribute {
  name: string;
}

export interface Category {
  enabled: boolean;
  subcategories: Subcategory[];
  variantAttributes: VariantAttribute[];
}

export type CategoryMap = { [key: string]: Category };

export interface CategoryInfo {
  name: string;
  productCount: number;
}


const CATEGORIES_PATH = 'site_config/categories';

// Helper to check if the data is in the old format (string[])
function isOldFormat(data: any): boolean {
    if (typeof data !== 'object' || data === null) return false;
    const firstValue = Object.values(data)[0];
    return Array.isArray(firstValue) && firstValue.every(item => typeof item === 'string');
}

// Helper to convert old format to new format
function convertToNewFormat(oldData: { [key: string]: string[] }): CategoryMap {
    const newData: CategoryMap = {};
    for (const key in oldData) {
        newData[key] = {
            enabled: true, // Assume all existing categories are enabled
            subcategories: oldData[key].map(sub => ({ name: sub, enabled: true })),
            variantAttributes: [], // Add empty variant attributes
        };
    }
    return newData;
}


export async function getCategories(): Promise<CategoryMap> {
  try {
    const { db } = initializeAdmin();
    const categoriesRef = db.ref(CATEGORIES_PATH);
    const snapshot = await categoriesRef.once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      // If the data is in the old format, convert it, save it, and return it.
      if (isOldFormat(data)) {
          const newData = convertToNewFormat(data);
          await db.ref(CATEGORIES_PATH).set(newData);
          return newData;
      }
       // Ensure variantAttributes exists
      Object.values(data).forEach((cat: any) => {
        if (!cat.variantAttributes) {
          cat.variantAttributes = [];
        }
      });
      return data;
    }
  } catch (error) {
    console.error("Error fetching categories from Firebase:", error);
  }
  
  // Return a default structure in the new format if nothing is in the DB
  return {
    'Furniture': { enabled: true, subcategories: [{name: 'Chairs', enabled: true}, {name: 'Tables', enabled: true}], variantAttributes: [{name: 'Color'}, {name: 'Material'}] },
    'Home Decor': { enabled: true, subcategories: [{name: 'Vases', enabled: true}, {name: 'Lamps', enabled: true}], variantAttributes: [{name: 'Color'}] },
    'Electronics': { enabled: true, subcategories: [{name: 'Cameras', enabled: true}, {name: 'Audio', enabled: true}], variantAttributes: [{name: 'Color'}] },
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
