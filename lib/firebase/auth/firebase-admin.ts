import * as admin from 'firebase-admin';

// Construire la clé privée correctement
const getPrivateKey = (): string => {
  let key = process.env.FIREBASE_PRIVATE_KEY;

  if (!key) throw new Error('FIREBASE_PRIVATE_KEY is not defined');

  // Enlever guillemets et espaces en début/fin
  key = key.trim().replace(/^"+|"+$/g, '');

  // Transformer \n littéraux en vrais sauts de ligne
  key = key.replace(/\\n/g, '\n');

  // Vérifier que ça ressemble bien à une clé PEM
  if (!key.includes('-----BEGIN PRIVATE KEY-----') || !key.includes('-----END PRIVATE KEY-----')) {
    throw new Error('FIREBASE_PRIVATE_KEY is malformed');
  }

  return key;
};


const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: getPrivateKey(),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    throw error;
  }
}

export const adminAuth = admin.auth();