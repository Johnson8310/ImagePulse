import * as admin from 'firebase-admin';
import '@/lib/firebase/init'; // Ensure env vars are loaded

let db: admin.firestore.Firestore;

try {
  if (admin.apps.length) {
    db = admin.firestore(admin.apps[0]!);
  } else {
    // Correctly extract the service account credentials from environment variables
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key needs to have its newlines properly escaped in the .env file
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    // Check if all the required service account details are present
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Firebase Admin SDK service account credentials are not fully set in .env. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore(app);
  }
} catch (error: any) {
  console.error('Firebase admin initialization error:', error.message);
  // Create a proxy to provide a clear error message when Firestore is accessed without proper initialization.
  db = new Proxy({}, {
    get: (target, prop) => {
      // Add a property to check if Firestore is initialized
      if (prop === 'isInitialized') return false;
      
      // Throw a specific error if any Firestore method is called
      throw new Error(`Firestore is not initialized. Failed to access property "${String(prop)}". Please check your Firebase server credentials in .env.`);
    }
  }) as admin.firestore.Firestore & { isInitialized: boolean };
}

// Add a flag to check for initialization status without throwing an error
if (!('isInitialized' in db)) {
  (db as any).isInitialized = true;
}

export { db };
