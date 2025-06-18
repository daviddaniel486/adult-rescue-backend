const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Adjust path if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Function to seed initial structure
async function seedFirestore() {
  try {
    const docRef = await db.collection('messages').add({
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a seeded message from script.',
      createdAt: new Date()
    });

    console.log(`✅ Seeded Firestore with document ID: ${docRef.id}`);
  } catch (err) {
    console.error('❌ Failed to seed Firestore:', err);
  }
}

seedFirestore();
