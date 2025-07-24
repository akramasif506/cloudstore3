
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/auth';
import type { Review, Product } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().min(1, "Rating is required.").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters."),
});

/**
 * Fetches a single product for display. This action uses the Admin SDK
 * and should only be called from server components.
 * @param id The product ID to fetch.
 * @returns A Product object or null if not found.
 */
export async function getProductForDisplay(id: string): Promise<Product | null> {
  try {
    const { db } = initializeAdmin();
    const productRef = db.ref(`products/${id}`);
    const snapshot = await productRef.once('value');
    if (snapshot.exists()) {
      const productData = snapshot.val();
      
      // Convert reviews from object to array if they exist
      let reviewsArray = [];
      if (productData.reviews) {
        reviewsArray = Object.keys(productData.reviews).map(key => ({
            ...productData.reviews[key],
            id: key,
        }));
      }

      return { ...productData, id, condition: productData.condition || 'Used', reviews: reviewsArray };
    }
    return null;
  } catch (error) {
    console.error("Error fetching product with Admin SDK:", error);
    return null;
  }
}

export async function submitReview(
  values: z.infer<typeof reviewSchema>
): Promise<{ success: boolean; message: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to leave a review.' };
  }

  const validatedFields = reviewSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid review data.' };
  }

  const { productId, rating, comment } = validatedFields.data;

  const { db } = initializeAdmin();
  const reviewsRef = db.ref(`products/${productId}/reviews`);
  const newReviewRef = db.ref(`products/${productId}/reviews`).push();

  const newReview: Review = {
    id: newReviewRef.key!,
    user: {
      id: currentUser.id,
      name: currentUser.name,
      avatarUrl: currentUser.profileImageUrl,
    },
    rating,
    comment,
    date: new Date().toISOString(),
  };

  try {
    await newReviewRef.set(newReview);
    revalidatePath(`/listings/${productId}`);
    return { success: true, message: 'Thank you for your review!' };
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, message: 'Failed to submit review.' };
  }
}
