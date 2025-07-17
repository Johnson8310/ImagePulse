'use server';

import { db } from '@/lib/firebase/server';
import type { Video } from '@/models/video';

function getVideosCollection() {
    if (!(db as any).isInitialized) {
        throw new Error('Firestore is not initialized.');
    }
    return db.collection('videos');
}

export async function isFirestoreAvailable(): Promise<boolean> {
  return (db as any).isInitialized;
}

export async function createVideo(video: Omit<Video, 'id'>): Promise<Video> {
  const videosCollection = getVideosCollection();
  const docRef = await videosCollection.add({
    ...video,
    createdAt: new Date(), // Ensure server-side timestamp
  });
  return { ...video, id: docRef.id };
}

export async function getVideosForUser(userId: string): Promise<Video[]> {
  const videosCollection = getVideosCollection();
  const snapshot = await videosCollection
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
    
  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      videoUri: data.videoUri,
      description: data.description,
      // Convert Firestore Timestamp to Date
      createdAt: data.createdAt.toDate(),
    };
  });
}
