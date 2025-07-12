// src/ai/flows/suggest-listing-details.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests a title and description for a product listing
 * based on the product image and details provided by the seller.
 *
 * @exports suggestListingDetails - An async function that takes product details and an image
 *                                   and returns a suggested title and description for the listing.
 * @exports SuggestListingDetailsInput - The input type for the suggestListingDetails function.
 * @exports SuggestListingDetailsOutput - The output type for the suggestListingDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestListingDetailsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A detailed description of the product.'),
  productImage: z.string().describe(
    'A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
  ),
  category: z.string().describe('The category of the product.'),
  subcategory: z.string().describe('The subcategory of the product.'),
  targetAudience: z.string().optional().describe('The target audience for the product, if known.'),
});

export type SuggestListingDetailsInput = z.infer<typeof SuggestListingDetailsInputSchema>;

const SuggestListingDetailsOutputSchema = z.object({
  suggestedTitle: z.string().describe('A suggested title for the product listing.'),
  suggestedDescription: z.string().describe('A suggested description for the product listing.'),
});

export type SuggestListingDetailsOutput = z.infer<typeof SuggestListingDetailsOutputSchema>;

export async function suggestListingDetails(
  input: SuggestListingDetailsInput
): Promise<SuggestListingDetailsOutput> {
  return suggestListingDetailsFlow(input);
}

const suggestListingDetailsPrompt = ai.definePrompt({
  name: 'suggestListingDetailsPrompt',
  input: {schema: SuggestListingDetailsInputSchema},
  output: {schema: SuggestListingDetailsOutputSchema},
  prompt: `You are an expert in creating compelling product listings. Based on the
  information provided, suggest an optimal title and description for the product.

  Product Name: {{{productName}}}
  Description: {{{productDescription}}}
  Category: {{{category}}}
  Subcategory: {{{subcategory}}}
  Target Audience: {{{targetAudience}}}
  Product Image: {{media url=productImage}}

  Please provide a title that is concise and attention-grabbing, and a description that
  highlights the key features and benefits of the product. The title should be under 60 characters.
  The description should be under 300 characters.
  Ensure that the title and description are optimized for search engines.
`,
});

const suggestListingDetailsFlow = ai.defineFlow(
  {
    name: 'suggestListingDetailsFlow',
    inputSchema: SuggestListingDetailsInputSchema,
    outputSchema: SuggestListingDetailsOutputSchema,
  },
  async input => {
    const {output} = await suggestListingDetailsPrompt(input);
    return output!;
  }
);
