
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
  prompt: `You are an expert copywriter for an online marketplace specializing in secondhand goods. Your task is to write a compelling, friendly, and descriptive product description.

Use the provided product information to craft a description that highlights the item's best features, potential uses, and unique character. Be honest but appealing. If a photo is provided, use it as the primary source of information for visual details.

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
{{/if}}

Generate a description of about 3-4 sentences. Start with an engaging hook and end with a call to action or a suggestion for its new home. Do not include price or condition, as those are in separate fields.`,
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
