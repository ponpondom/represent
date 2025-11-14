import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBIABAV4L9dC5gLzT7KXM6pvXItaQRaOf0',
  authDomain: 'represent-app-9978c.firebaseapp.com',
  projectId: 'represent-app-9978c',
  storageBucket: 'represent-app-9978c.appspot.com',
  messagingSenderId: '37521959235',
  appId: '1:37521959235:web:539ec27f502696932ce7f6',
  measurementId: 'G-9KHS434SW1',
};

const app = initializeApp(firebaseConfig);

// Use the default auth instance. If you need native AsyncStorage persistence,
// configure it with the appropriate helper for your Firebase SDK/platform.
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };

