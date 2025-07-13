
'use server';

/**
 * @fileOverview This file defines a Genkit flow that extracts structured listing details
 * from a user's free-text description and a product image.
 *
 * @exports extractListingDetails - An async function that takes a user description and an image
 *                                   and returns a full, structured product listing.
 * @exports ExtractListingDetailsInput - The input type for the function.
 * @exports ExtractListingDetailsOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const categories = {
  'Furniture': ['Chairs', 'Tables', 'Shelving', 'Beds'],
  'Home Decor': ['Vases', 'Lamps', 'Rugs', 'Wall Art'],
  'Cloths': ['Jackets', 'Dresses', 'Shoes', 'Accessories'],
  'Electronics': ['Cameras', 'Audio', 'Computers', 'Phones'],
  'Outdoor & Sports': ['Bikes', 'Camping Gear', 'Fitness'],
  'Grocery': ['Snacks', 'Beverages', 'Pantry Staples'],
  'Other': ['Miscellaneous'],
};

const categoryList = Object.entries(categories).map(([category, subcategories]) =>
  `- ${category}: ${subcategories.join(', ')}`
).join('\n');

const conditions = ['New', 'Like New', 'Used'];

const ExtractListingDetailsInputSchema = z.object({
  userDescription: z.string().describe('The free-text description of the product provided by the user, which may include details about condition and price.'),
  productImage: z.string().describe(
    'A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
  ),
});

export type ExtractListingDetailsInput = z.infer<typeof ExtractListingDetailsInputSchema>;

const ExtractListingDetailsOutputSchema = z.object({
  productName: z.string().describe('A compelling, SEO-friendly title for the product listing. Should be under 60 characters.'),
  productDescription: z.string().describe('A detailed, well-structured description for the product listing. Should highlight key features and condition. Should be under 300 characters.'),
  price: z.number().describe("The product's price, extracted from the user's description. Should be a number."),
  category: z.nativeEnum(Object.keys(categories)).describe('The most appropriate top-level category for the product.'),
  subcategory: z.string().describe('The most appropriate subcategory for the product, based on the selected category.'),
  condition: z.enum(conditions as [string, ...string[]]).describe("The condition of the item. Choose from 'New', 'Like New', or 'Used' based on the user's description."),
});

export type ExtractListingDetailsOutput = z.infer<typeof ExtractListingDetailsOutputSchema>;


export async function extractListingDetails(
  input: ExtractListingDetailsInput
): Promise<ExtractListingDetailsOutput> {
  return extractListingDetailsFlow(input);
}

const extractListingDetailsPrompt = ai.definePrompt({
  name: 'extractListingDetailsPrompt',
  input: {schema: ExtractListingDetailsInputSchema},
  output: {schema: ExtractListingDetailsOutputSchema},
  prompt: `You are an expert marketplace assistant. Your task is to analyze a user's description and an image of an item they want to sell, and then create a perfect product listing from it.

You must extract or generate the following information:
1.  **productName**: Create a short, catchy, and descriptive title for the item.
2.  **productDescription**: Write a clear, appealing description. Mention the item's features and any condition details from the user's text.
3.  **price**: Identify the price from the user's text. It must be a number.
4.  **category** and **subcategory**: Based on the image and text, classify the item into the most relevant category and subcategory from the provided list.
5.  **condition**: Determine the item's condition from the user's description. You must choose one of the following options: ${conditions.join(', ')}.

Here are the available categories and subcategories:
${categoryList}

You MUST choose a category from the list. For the subcategory, you must choose one of the corresponding values for that category.

User's description:
"{{{userDescription}}}"

Product Image:
{{media url=productImage}}

Now, generate the structured product listing.
`,
});

const extractListingDetailsFlow = ai.defineFlow(
  {
    name: 'extractListingDetailsFlow',
    inputSchema: ExtractListingDetailsInputSchema,
    outputSchema: ExtractListingDetailsOutputSchema,
  },
  async input => {
    const {output} = await extractListingDetailsPrompt(input);
    return output!;
  }
);
