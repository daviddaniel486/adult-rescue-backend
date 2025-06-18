require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe');

const app = express();
app.use(cors());
app.use(express.json());

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// Stripe Donation Route
app.post('/create-checkout-session', async (req, res) => {
  const { name, email, amount } = req.body;
  if (amount < 1000) {
    return res.status(400).json({
      error: 'Minimum donation is ₦1000 due to Stripe processing limits.'
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'ngn',
            product_data: {
              name: `Donation from ${name}`,
            },
            unit_amount: parseInt(amount) * 100, // amount in kobo
          },
          quantity: 1,
        },
      ],
      success_url: 'https://adult-rescue-initiative-2ee00.web.app/success.html',
      cancel_url: 'https://adult-rescue-initiative-2ee00.web.app/cancel.html',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ error: 'Unable to create Stripe session' });
  }
});

// Contact Form Handler
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    await db.collection('messages').add({
      name,
      email,
      message,
      createdAt: new Date()
    });

    res.status(200).json({ message: 'Message received and stored!' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// Volunteer Form Handler
app.post('/volunteer', async (req, res) => {
  const { fullName, email, phone, availability, skills } = req.body;

  if (!fullName || !email || !phone || !availability) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  try {
    const db = admin.firestore();

    await db.collection('volunteers').add({
      fullName,
      email,
      phone,
      availability,
      skills,
      createdAt: new Date(),
    });

    res.status(200).json({ message: 'Volunteer form submitted successfully!' });
  } catch (error) {
    console.error('Volunteer form error:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});
// Health‑check: list top‑level collections  
app.get('/_health/firestore', async (req, res) => {
  try {
    const collections = await admin.firestore().listCollections();
    const names      = collections.map(col => col.id);
    res.json({ collections: names });
  } catch (err) {
    console.error('Firestore health‑check error:', err);
    res.status(500).json({ error: 'Cannot list collections', details: err.message });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
