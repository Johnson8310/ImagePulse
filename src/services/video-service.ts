'use server';

import { db } from '@/lib/firebase/server';

export interface Video {
  id?: string;
  userId: string;
  videoUri: string;
  description: string;
  createdAt: Date;
}

const videosCollection = db.collection('videos');

export async function createVideo(video: Omit<Video, 'id'>): Promise<Video> {
  const docRef = await videosCollection.add({
    ...video,
    createdAt: new Date(), // Ensure server-side timestamp
  });
  return { ...video, id: docRef.id };
}

export async function getVideosForUser(userId: string): Promise<Video[]> {
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
