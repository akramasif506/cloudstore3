

'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { VariantSetMap } from '../manage-variants/actions';

export interface Subcategory {
  name: string;
  enabled: boolean;
  taxPercent?: number;
}

export interface VariantAttribute {
  name: string;
  variantSetId: string; // ID of the variant set, e.g., 'apparel-sizes'
}

export interface Category {
  enabled: boolean;
  subcategories: Subcategory[];
  variantAttributes: VariantAttribute[];
  taxPercent?: number;
}

export type CategoryMap = { [key: string]: Category };

export interface CategoryInfo {
  name: string;
  productCount: number;
}


const CATEGORIES_PATH = 'site_config/categories';
const VARIANTS_PATH = 'site_config/variants';


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
            subcategories: oldData[key].map(sub => ({ name: sub, enabled: true, taxPercent: 0 })),
            variantAttributes: [], // Add empty variant attributes
            taxPercent: 0,
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
      let data = snapshot.val();
      // If the data is in the old format, convert it, save it, and return it.
      if (isOldFormat(data)) {
          const newData = convertToNewFormat(data);
          await db.ref(CATEGORIES_PATH).set(newData);
          data = newData;
      }
       // Ensure all required fields exist
      Object.values(data).forEach((cat: any) => {
        if (!cat.variantAttributes) {
          cat.variantAttributes = [];
        } else {
            // Ensure each attribute has a variantSetId
            cat.variantAttributes = cat.variantAttributes.map((attr: any) => {
                if (typeof attr === 'string') { // Handle legacy string-only attributes
                    return { name: attr, variantSetId: '' };
                }
                if (!attr.variantSetId) {
                    attr.variantSetId = '';
                }
                return attr;
            });
        }
        if (cat.taxPercent === undefined) {
            cat.taxPercent = 0;
        }
        cat.subcategories.forEach((sub: any) => {
            if (sub.taxPercent === undefined) {
                sub.taxPercent = 0;
            }
        });
      });
      return data;
    }
  } catch (error) {
    console.error("Error fetching categories from Firebase:", error);
  }
  
  // Return a default structure in the new format if nothing is in the DB
  return {
    'Furniture': { enabled: true, subcategories: [{name: 'Chairs', enabled: true, taxPercent: 0}, {name: 'Tables', enabled: true, taxPercent: 0}], variantAttributes: [{name: 'Color', variantSetId: 'standard-colors'}, {name: 'Material', variantSetId: ''}], taxPercent: 5 },
    'Home Decor': { enabled: true, subcategories: [{name: 'Vases', enabled: true, taxPercent: 0}, {name: 'Lamps', enabled: true, taxPercent: 0}], variantAttributes: [{name: 'Color', variantSetId: 'standard-colors'}], taxPercent: 5 },
    'Electronics': { enabled: true, subcategories: [{name: 'Cameras', enabled: true, taxPercent: 0}, {name: 'Audio', enabled: true, taxPercent: 0}], variantAttributes: [{name: 'Color', variantSetId: 'standard-colors'}], taxPercent: 18 },
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
    revalidatePath('/cart');

    return { success: true, message: 'Categories have been saved successfully!' };
  } catch (error) {
    console.error("Error saving categories to Firebase:", error);
    return { success: false, message: 'Failed to save categories.' };
  }
}

// Fetch variant sets for use in the category form
export async function getVariantSetsForCategories(): Promise<VariantSetMap> {
  try {
    const { db } = initializeAdmin();
    const variantsRef = db.ref(VARIANTS_PATH);
    const snapshot = await variantsRef.once('value');
    if (snapshot.exists()) {
      return snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching variant sets for categories:", error);
  }
  return {};
}
