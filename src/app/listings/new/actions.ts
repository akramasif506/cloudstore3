
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';


export async function createListing(formData: FormData) {
  const session = cookies().get('session')?.value;
  if (!session) {
    return {
      success: false,
      message: 'You must be logged in to create a listing.'
    }
  }

  try {
    // We construct the full URL for the API route.
    const apiUrl = new URL('/api/listings', process.env.NEXT_PUBLIC_URL);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        // Pass the session cookie to the API route for authentication.
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

  // If successful, redirect the user to their listings page.
  redirect('/my-listings');
}
