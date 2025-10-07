// src/lib/firebaseAdmin.ts
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// 🔹 Parser le service account depuis l'env
let serviceAccount = {};
if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  } catch (err) {
    console.error("Impossible de parser FIREBASE_ADMIN_CREDENTIALS :", err);
  }
}

// 🔹 Initialiser Firebase Admin
export const adminApp = getApps().length === 0
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApp();

// 🔹 Exports
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
