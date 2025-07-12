
'use server';

import { z } from 'zod';
import { listingSchema } from '@/lib/schemas';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';


export async function createListing(formData: FormData) {
  // We no longer need validation or Firebase logic here.
  // We just pass the form data to the API route.
  
  const session = cookies().get('session')?.value;
  if (!session) {
    return {
      success: false,
      message: 'You must be logged in to create a listing.'
    }
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Cookie': `session=${session}`
      },
      body: formData,
    });
    
    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'An error occurred.',
        errors: result.errors,
      };
    }
    
  } catch (error) {
    console.error('Error calling create listing API:', error);
    if (error instanceof Error) {
        return { success: false, message: `Failed to create listing: ${error.message}` };
    }
    return { success: false, message: 'An unknown error occurred while creating the listing.' };
  }

  redirect('/my-listings');
}
