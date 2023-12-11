const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const app = express();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://trustiqueassist-default-rtdb.firebaseio.com/',
});

// Middleware to parse JSON bodies
app.use(express.json());

// Google Sign-In
app.post('/googleSignIn', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // Use decodedToken to get user information or perform actions
    res.status(200).json({ message: 'Successfully signed in with Google.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Firebase Phone Authentication - Sending OTP
app.post('/sendOTP', async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const verification = await admin.auth().createUser({
      phoneNumber,
    });
    // Send verification to the phone number
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify OTP from Firebase Phone Authentication
app.post('/verifyOTP', async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const signInResult = await admin.auth().signInWithPhoneNumber(phoneNumber, otp);
    // Use signInResult to get user information or perform actions
    res.status(200).json({ message: 'Successfully signed in with OTP.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
