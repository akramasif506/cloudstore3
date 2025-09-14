
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { VariantSetMap } from '../manage-variants/actions';
import { v4 as uuidv4 } from 'uuid';


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
  id: string; // Stable, unique ID
  name: string;
  enabled: boolean;
  subcategories: Subcategory[];
  variantAttributes: VariantAttribute[];
  taxPercent?: number;
}

// The key is now the stable category ID
export type CategoryMap = { [id: string]: Category };

export interface CategoryInfo {
  id: string;
  name: string;
  productCount: number;
}


const CATEGORIES_PATH = 'site_config/categories';
const VARIANTS_PATH = 'site_config/variants';


// Helper to check if the data is in the old format (where keys are kebab-case names)
function isOldFormat(data: any): boolean {
    if (typeof data !== 'object' || data === null || Object.keys(data).length === 0) return false;
    // Check if the first category object is missing an 'id' field.
    const firstKey = Object.keys(data)[0];
    const firstValue = data[firstKey];
    return typeof firstValue === 'object' && firstValue !== null && !firstValue.id;
}


// Helper to convert old format (kebab-case keys) to new format (UUID keys)
function migrateToIdBased(oldData: { [key: string]: any }): CategoryMap {
    const newData: CategoryMap = {};
    for (const key in oldData) {
        const newId = uuidv4();
        // The old format didn't have a 'name' field inside, the key was the name.
        const name = oldData[key].name || toTitleCase(key);
        newData[newId] = {
            id: newId,
            name: name,
            enabled: oldData[key].enabled ?? true,
            subcategories: oldData[key].subcategories || [],
            variantAttributes: oldData[key].variantAttributes || [],
            taxPercent: oldData[key].taxPercent || 0,
        };
    }
    return newData;
}

// Helper to convert kebab-case to Title Case for migration
const toTitleCase = (str: string) =>
  str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());


export async function getCategories(): Promise<CategoryMap> {
  try {
    const { db } = initializeAdmin();
    const categoriesRef = db.ref(CATEGORIES_PATH);
    const snapshot = await categoriesRef.once('value');

    if (snapshot.exists()) {
      let data = snapshot.val();
      
      // One-time migration from kebab-case keys to stable IDs
      if (isOldFormat(data)) {
          const newData = migrateToIdBased(data);
          await db.ref(CATEGORIES_PATH).set(newData); // Overwrite with new format
          data = newData;
      }
      
      // Ensure all required fields exist for data that might be partially migrated
      Object.values(data).forEach((cat: any) => {
        if (!cat.id) { // Should be handled by migration, but as a safeguard
            cat.id = Object.keys(data).find(k => data[k] === cat) || uuidv4();
        }
        if (!cat.name) {
            cat.name = toTitleCase(cat.id);
        }
        if (!cat.variantAttributes) {
          cat.variantAttributes = [];
        }
        if (cat.taxPercent === undefined) {
            cat.taxPercent = 0;
        }
        if (!cat.subcategories) {
            cat.subcategories = [];
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
    console.error("Error fetching/migrating categories from Firebase:", error);
  }
  
  // Return a default structure in the new format if nothing is in the DB
  const defaultCategories: CategoryMap = {
    'furniture-id': { id: "furniture-id", name: 'Furniture', enabled: true, subcategories: [{name: 'Chairs', enabled: true, taxPercent: 0}, {name: 'Tables', enabled: true, taxPercent: 0}], variantAttributes: [{name: 'Color', variantSetId: 'standard-colors'}, {name: 'Material', variantSetId: ''}], taxPercent: 5 },
    'home-decor-id': { id: "home-decor-id", name: 'Home Decor', enabled: true, subcategories: [{name: 'Vases', enabled: true, taxPercent: 0}, {name: 'Lamps', enabled: true, taxPercent: 0}], variantAttributes: [{name: 'Color', variantSetId: 'standard-colors'}], taxPercent: 5 },
    'electronics-id': { id: "electronics-id", name: 'Electronics', enabled: true, subcategories: [{name: 'Cameras', enabled: true, taxPercent: 0}, {name: 'Audio', enabled: true, taxPercent: 0}], variantAttributes: [{name: 'Color', variantSetId: 'standard-colors'}], taxPercent: 18 },
  };

  return defaultCategories;
}

export async function deleteCategory(
  categoryId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = initializeAdmin();
    const categoryRef = db.ref(`${CATEGORIES_PATH}/${categoryId}`);
    await categoryRef.remove();

    revalidatePath('/dashboard/manage-categories');
    return { success: true, message: 'Category deleted successfully.' };

  } catch(error) {
    console.error("Error deleting category from Firebase:", error);
    return { success: false, message: 'Failed to delete category.' };
  }
}

export async function saveSingleCategory(
  category: Category
): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = initializeAdmin();
    // Use .update() to modify only the specific category by its ID (key)
    const updates: { [key: string]: Category } = {};
    updates[`${CATEGORIES_PATH}/${category.id}`] = category;

    await db.ref().update(updates);

    // Revalidate paths that use categories
    revalidatePath('/listings/new');
    revalidatePath('/');
    revalidatePath('/dashboard/manage-categories');
    revalidatePath('/cart');

    return { success: true, message: `Category '${category.name}' saved successfully!` };
  } catch (error) {
    console.error("Error saving single category to Firebase:", error);
    return { success: false, message: 'Failed to save category.' };
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

export async function createNewCategory(
  categoryName: string
): Promise<{ success: boolean; message: string; newCategory?: Category }> {
  const newId = uuidv4();
  const newCategory: Category = {
    id: newId,
    name: categoryName,
    enabled: true,
    subcategories: [],
    variantAttributes: [],
    taxPercent: 0,
  };

  try {
    const { db } = initializeAdmin();
    const categoryRef = db.ref(`${CATEGORIES_PATH}/${newId}`);
    await categoryRef.set(newCategory);

    revalidatePath('/dashboard/manage-categories');
    return { success: true, message: 'Category created!', newCategory };
  } catch(error) {
    console.error("Error creating new category:", error);
    return { success: false, message: 'Failed to create new category.' };
  }
}
