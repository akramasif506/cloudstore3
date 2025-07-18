
'use server';

import { z } from 'zod';
import { initializeAdmin } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/auth';
import type { Review } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().min(1, "Rating is required.").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters."),
});

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
