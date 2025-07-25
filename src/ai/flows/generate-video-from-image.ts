'use server';
/**
 * @fileOverview This file defines a Genkit flow that generates a new video from an existing image and a text prompt.
 *
 * - generateVideoFromImage - A function that accepts an image and generates a new video.
 * - GenerateVideoFromImageInput - The input type for the generateVideoFromImage function.
 * - GenerateVideoFromImageOutput - The return type for the generateVideoFromImage function.
 */

import {ai} from '@/ai/genkit';
import { createVideo, isFirestoreAvailable } from '@/services/video-service';
import {z} from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import * as fs from 'fs';
import { Readable } from 'stream';

// Dedicated Genkit instance for video generation using a separate API key
const videoAi = genkit({
    plugins: [googleAI({ apiKey: process.env.VIDEO_API_KEY })],
});

const GenerateVideoFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to use as inspiration, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('A text description of the desired video to create.'),
  userId: z.string().describe('The ID of the user creating the video.'),
});
export type GenerateVideoFromImageInput = z.infer<typeof GenerateVideoFromImageInputSchema>;

const GenerateVideoFromImageOutputSchema = z.object({
  videoDataUri: z.string().describe('The generated video as a data URI.'),
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
    
    let { operation } = await videoAi.generate({
        model: 'googleai/veo-2.0-generate-001',
        prompt: [
            { media: { url: input.photoDataUri } },
            {
            text: `Generate a new, stylized video based on the provided image and the following description: "${input.description}".`,
            },
        ],
        config: {
            durationSeconds: 5,
            aspectRatio: '16:9',
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes. Note that this may take some time.
    while (!operation.done) {
        operation = await videoAi.checkOperation(operation);
        // Sleep for 5 seconds before checking again.
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    
    if (operation.error) {
        console.error('Video generation failed:', operation.error);
        throw new Error('failed to generate video: ' + operation.error.message);
    }
    
    const video = operation.output?.message?.content.find((p) => !!p.media);

    if (!video || !video.media?.url) {
        throw new Error('Failed to find the generated video');
    }

    const videoDataUri = video.media.url;


    const firestoreReady = await isFirestoreAvailable();
    if (firestoreReady) {
        try {
            await createVideo({
              userId: input.userId,
              videoUri: videoDataUri, 
              description: input.description,
              createdAt: new Date(),
            });
        } catch (error) {
            console.error("Failed to save video to Firestore:", error);
            // Non-blocking error, we can still return the video to the user.
        }
    } else {
        console.warn('Firestore is not initialized. Skipping video save. Please check your .env credentials.');
    }

    return { videoDataUri };
  }
);
