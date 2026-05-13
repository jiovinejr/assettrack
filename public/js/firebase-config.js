// ─────────────────────────────────────────────────────────
//  ASSETTRACK — Firebase Configuration
//  Fill in your values from:
//  Firebase Console → Project Settings → Your apps → SDK setup
// ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyCgZL1FTjik_wdJ21zdccjJ6R4Au8TDsxo",
  authDomain: "assettrack-iovines.firebaseapp.com",
  projectId: "assettrack-iovines",
  storageBucket: "assettrack-iovines.firebasestorage.app",
  messagingSenderId: "656526945129",
  appId: "1:656526945129:web:b1f506d25e60699f2f6bf8"
};

firebase.initializeApp(firebaseConfig);
const db     = firebase.firestore();
const ASSETS = db.collection('assets');