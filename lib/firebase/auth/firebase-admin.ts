import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';

var admin = require("firebase-admin");


var serviceAccount = require("../geneailogyFirebaseAdmin.json");

let privateKey;
try {
  // Essayez d'abord de parser comme JSON (format pour Vercel)
  const keyObj = JSON.parse(process.env.FIREBASE_PRIVATE_KEY || "{}");
  privateKey = keyObj.value || "";
} catch (e) {
  // Si le parse échoue, utilisez directement la valeur (format pour dev)
  privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
}

// Remplacez toujours les \n par des sauts de ligne réels
privateKey = privateKey.replace(/\\n/g, '\n');

const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey
};

export const adminApp = getApps().length === 0
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApp();


export const auth = import('firebase-admin/auth').then((mod) => mod.getAuth(adminApp));