// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth,GoogleAuthProvider} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCNoMsbF96gte9MwFHZqPb8b39dA0T3fmc",
  authDomain: "simple-login-page-a2fc7.firebaseapp.com",
  projectId: "simple-login-page-a2fc7",
  storageBucket: "simple-login-page-a2fc7.appspot.com",
  messagingSenderId: "1060283564694",
  appId: "1:1060283564694:web:542bb12402447db5c338b7",
  measurementId: "G-MGKD6EER79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {auth,provider}
