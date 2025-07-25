'use server';
/**
 * @fileOverview This file defines a Genkit flow that generates a new image from an existing image and a text prompt.
 *
 * - generateVideoFromImage - A function that accepts an image and generates a new image.
 * - GenerateVideoFromImageInput - The input type for the generateVideoFromImage function.
 * - GenerateVideoFromImageOutput - The return type for the generateVideoFromImage function.
 */

import {ai} from '@/ai/genkit';
import { createVideo, isFirestoreAvailable } from '@/services/video-service';
import {z} from 'zod';

const GenerateVideoFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to use as inspiration, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('A text description of the desired image to create.'),
  userId: z.string().describe('The ID of the user creating the image.'),
});
export type GenerateVideoFromImageInput = z.infer<typeof GenerateVideoFromImageInputSchema>;

const GenerateVideoFromImageOutputSchema = z.object({
  // Note: The field is named `videoDataUri` for consistency with the front-end,
  // but it will contain an image data URI.
  videoDataUri: z.string().describe('The generated image as a data URI.'),
});
export type GenerateVideoFromImageOutput = z.infer<typeof GenerateVideoFromImageOutputSchema>;

export async function generateVideoFromImage(input: GenerateVideoFromImageInput): Promise<GenerateVideoFromImageOutput> {
  return generateVideoFromImageFlow(input);
}

const generateVideoFromImageFlow = ai.defineFlow(
  {
    name: 'generateVideoFromImageFlow',
    inputSchema: GenerateVideoFromImageInputSchema,
    outputSchema: GenerateVideoFromImageOutputSchema,
  },
  async (input) => {
    
    // Note: Using an image generation model as a placeholder for video generation.
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: input.photoDataUri } },
        {
          text: `Generate a new, stylized image based on the provided image and the following description: "${input.description}".`,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error('Failed to find the generated image');
    }

    const imageDataUri = media.url;


    const firestoreReady = await isFirestoreAvailable();
    if (firestoreReady) {
        try {
            await createVideo({
              userId: input.userId,
              videoUri: imageDataUri, // Saving the image URI to Firestore
              description: input.description,
              createdAt: new Date(),
            });
        } catch (error) {
            console.error("Failed to save image to Firestore:", error);
            // Non-blocking error, we can still return the image to the user.
        }
    } else {
        console.warn('Firestore is not initialized. Skipping image save. Please check your .env credentials.');
    }

    // The key is `videoDataUri` to match what the frontend expects.
    return { videoDataUri: imageDataUri };
  }
);
