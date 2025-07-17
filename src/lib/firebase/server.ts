'use server';
import * as admin from 'firebase-admin';
import '@/lib/firebase/init'; // Ensure env vars are loaded

let app: admin.app.App;

if (admin.apps.length > 0) {
  app = admin.apps[0]!;
} else {
  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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
    // Don't throw here, as it can break builds where server-side is not strictly needed
  } else {
     try {
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
     } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
     }
  }
}

const db: admin.firestore.Firestore = app! ? admin.firestore(app) : undefined as any;

export { db };
