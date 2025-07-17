'use server';
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

let app: admin.app.App;

if (typeof window === 'undefined') {
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
  } else {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key can be tricky with environment variables.
      // This handles the format it's often stored in.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      const missingKeys = [
        !serviceAccount.projectId && 'FIREBASE_PROJECT_ID',
        !serviceAccount.clientEmail && 'FIREBASE_CLIENT_EMAIL',
        !serviceAccount.privateKey && 'FIREBASE_PRIVATE_KEY',
      ].filter(Boolean).join(', ');

      const errorMessage = `Firebase Admin SDK is not configured. Missing environment variables: ${missingKeys}. Please add them to your .env file.`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
        throw new Error('Could not initialize Firebase Admin SDK.');
    }
  }
}

// Firestore should only be initialized on the server
const db = typeof window === 'undefined' ? admin.firestore(app!) : (null as unknown as admin.firestore.Firestore);

export { db };
