import admin from "firebase-admin";

var serviceAccount = JSON.stringify({
    "type": process.env.FIREBASE_TYPE || 'xxx',
    "project_id": process.env.FIREBASE_PROJECT_ID || 'xxx',
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID || 'xxx',
    "private_key": process.env.FIREBASE_PRIVATE_KEY || 'xxx',
    "client_email": process.env.FIREBASE_CLIENT_EMAIL || 'xxx',
    "client_id": process.env.FIREBASE_CLIENT_ID || 'xxx',
    "auth_uri": process.env.FIREBASE_AUTH_URI || 'xxx',
    "token_uri": process.env.FIREBASE_TOKEN_URI || 'xxx',
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'xxx',
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL || 'xxx',
    "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN || 'xxx'
})

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export default admin