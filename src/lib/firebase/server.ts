import * as admin from 'firebase-admin';
import '@/lib/firebase/init'; // Ensure env vars are loaded

let db: admin.firestore.Firestore;

try {
  if (admin.apps.length) {
    db = admin.firestore(admin.apps[0]!);
  } else {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Firebase Admin SDK is not configured. Missing environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore(app);
  }
} catch (error: any) {
  console.error('Firebase admin initialization error:', error.message);
  // To prevent the app from crashing but still indicating a problem,
  // we can assign a proxy that throws an error when any of its methods are called.
  db = new Proxy({}, {
    get: (_, prop) => {
      if (prop === 'isInitialized') return false;
      throw new Error(`Firestore is not initialized. Failed to access property "${String(prop)}". Please check your Firebase server credentials in .env.`);
    }
  }) as admin.firestore.Firestore & { isInitialized: boolean };
}

if (!('isInitialized' in db)) {
  (db as any).isInitialized = true;
}


export { db };
