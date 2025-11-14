// test-call.js
(async function() {
  try {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, signInAnonymously } = await import('firebase/auth');
    const { getFunctions, httpsCallable } = await import('firebase/functions');

    // <- FILL THESE with your project's web SDK config from Firebase Console (Project settings -> SDK)
    const firebaseConfig = {
apiKey: "AIzaSyBIABAV4L9dC5gLzT7KXM6pvXItaQRaOf0",
authDomain: "represent-app-9978c.firebaseapp.com",
projectId: "represent-app-9978c",
appId: "1:37521959235:web:539ec27f502696932ce7f6"
};

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    

    // Sign in anonymously so the callable will have an ID token if required
    await signInAnonymously(auth);

    // Use your functions region if not us-central1
    const funcs = getFunctions(app, "us-central1");
    const call = httpsCallable(funcs, "representatives");

    // Test address known to map to IL CD13 / SLDU 48 / SLDL 95
    const res = await call({ address: "100 W Randolph St, Chicago, IL 60601" });

    console.log(JSON.stringify(res.data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("CALL ERROR:", err && (err.stack || err.message) ? (err.stack || err.message) : err);
    process.exit(1);
  }
})();