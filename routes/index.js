const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json'); // Update this path
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add any other configuration if needed
});

// MongoDB connection using MongoDB Node.js driver
const uri = 'mongodb+srv://trustique:<password>@<organization>mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let User;

// Connect to MongoDB
client.connect(err => {
  if (err) {
    console.error('Error connecting to MongoDB:', err);
    return;
  }
  const database = client.db('users');
  User = database.collection('onboarding');
  console.log('Connected to MongoDB');
});

// Signup using email and password
app.post('/signup/email', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if the email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const newUser = {
        email,
        password: hashedPassword,
      };
  
      // Save the user to the database
      await User.insertOne(newUser);
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Login using email and password
  app.post('/login/email', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Create and return a JWT token
      const token = jwt.sign({ userId: user._id }, 'YOUR_SECRET_KEY', {
        expiresIn: '2d', // Change this expiration as needed
      });
  
      // Set a cookie with the token that expires in 2 days
      res.cookie('token', token, {
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
        httpOnly: true,
      });
  
      res.status(200).json({ message: 'Login successful' });
    } catch (err) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  // Logout route
  app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
  });

// Signup using phone number with OTP via Firebase SMS
app.post('/signup/phone', async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if the phone number already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save the OTP in the user collection (for verification)
    await User.insertOne({ phone, otp });

    // Send OTP via Firebase SMS
    const message = {
      data: { otp: otp.toString() },
      phoneNumber: phone.toString(), // Update this with your phone number format
    };

    await admin.messaging().send(message);

    res.status(201).json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Verify OTP and complete signup
app.post('/verify/phone', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Find the user by phone and OTP
    const user = await User.findOne({ phone, otp });

    if (!user) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Create a new user
    const newUser = {
      phone,
    };

    // Save the user to the database
    await User.insertOne(newUser);

    // Automatically log in the user after signup
    const token = jwt.sign({ userId: newUser._id }, 'TrustiqueAssist', {
      expiresIn: '2d', // Change this expiration as needed
    });

    // Set a cookie with the token that expires in 2 days
    res.cookie('token', token, {
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
      httpOnly: true,
    });

    res.status(201).json({ message: 'User signed up and logged in successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Root endpoint to check the session
app.get('/', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, 'TrustiqueAssist');

    // Create a new token for refresh (assuming the user is valid)
    const newToken = jwt.sign({ userId: decoded.userId }, 'TrustiqueAssist', {
      expiresIn: '2d', // Change this expiration as needed
    });

    // Set a new cookie with the refreshed token that expires in 2 days
    res.cookie('token', newToken, {
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days in milliseconds
      httpOnly: true,
    });

    // Delete the previous token and send the new token to the client
    res.clearCookie('token');
    res.status(200).json({ token: newToken });
  } catch (err) {
    // If the token is expired or invalid, ask the user to login again
    res.status(401).json({ message: 'Token expired or invalid. Please login again' });
  }
});
