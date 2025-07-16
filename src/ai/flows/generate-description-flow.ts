
'use server';
/**
 * @fileOverview An AI flow for generating product descriptions.
 *
 * - generateDescription - A function that creates a compelling product description.
 * - GenerateDescriptionInput - The input type for the generateDescription function.
 * - GenerateDescriptionOutput - The return type for the generateDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateDescriptionInputSchema = z.object({
  productName: z.string().describe('The title or name of the product.'),
  category: z.string().optional().describe('The main category of the product.'),
  subcategory: z.string().optional().describe('The subcategory of the product.'),
  photoDataUri: z.string().optional().describe("An optional photo of the product as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated, compelling product description.'),
});
export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

// Exported wrapper function to be called from the client
export async function generateDescription(input: GenerateDescriptionInput): Promise<GenerateDescriptionOutput> {
  return generateDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: { schema: GenerateDescriptionInputSchema },
  output: { schema: GenerateDescriptionOutputSchema },
  prompt: `You are an expert copywriter for an online marketplace, helping a user sell their secondhand item.
Your goal is to write a short, appealing description (about 2-3 sentences) that will attract buyers.

Based on the provided information, write a description that:
1.  Is friendly and inviting.
2.  Directly highlights the key features, quality, and visual appeal of the item. Use the photo as the primary source for visual details.
3.  Encourages a potential buyer by suggesting a use or benefit.

Do not mention price or the specific item condition (e.g., "Used"), as those are in separate fields.

Product Information:
- Title: {{{productName}}}
{{#if category}}
- Category: {{{category}}}
{{/if}}
{{#if subcategory}}
- Subcategory: {{{subcategory}}}
{{/if}}
{{#if photoDataUri}}
- Photo: {{media url=photoDataUri}}
{{/if}}`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: GenerateDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    // The prompt is configured to return the correct output schema directly.
    // The '!' non-null assertion is safe here because if output is null, Genkit would have thrown an error.
    return output!;
  }
);
