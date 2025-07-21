'use server';
/**
 * @fileOverview This file defines a Genkit flow that generates a short, subtly animated video clip from an uploaded image.
 *
 * - generateVideoFromImage - A function that accepts an image and generates a video.
 * - GenerateVideoFromImageInput - The input type for the generateVideoFromImage function.
 * - GenerateVideoFromImageOutput - The return type for the generateVideoFromImage function.
 */

import {ai} from '@/ai/genkit';
import { createVideo, isFirestoreAvailable } from '@/services/video-service';
import {z} from 'genkit';
import { MediaPart } from 'genkit/cohere';
import * as fs from 'fs';
import { Readable } from 'stream';


const GenerateVideoFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to animate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('A text description of the desired animation.'),
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
    let { operation } = await ai.generate({
        model: 'googleai/veo-2.0-generate-001',
        prompt: [
            { media: { url: input.photoDataUri } },
            {
            text: `Create a subtly animated video based on this image. The animation should follow this description: "${input.description}".`,
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

    // Wait until the operation completes.
    while (!operation.done) {
        operation = await ai.checkOperation(operation);
        // Sleep for 5 seconds before checking again.
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
        throw new Error('failed to generate video: ' + operation.error.message);
    }
    
    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
        throw new Error('Failed to find the generated video');
    }

    // Convert the remote URL to a data URI
    const videoDataUri = await convertUrlToDataUri(video.media.url);

    // Save the generated video to Firestore, but only if it's initialized
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


async function convertUrlToDataUri(url: string): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    // Add API key before fetching the video.
    const response = await fetch(`${url}&key=${process.env.GEMINI_API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch video from URL: ${url}. Status: ${response.statusText}`);
    }

    const videoBuffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';
    
    return `data:${contentType};base64,${videoBuffer.toString('base64')}`;
}
