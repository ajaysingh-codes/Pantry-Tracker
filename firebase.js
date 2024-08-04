// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXw9aKLbp1OJNzoSfTc6nzp5t9Uroo9Qo",
  authDomain: "pantry-tracker-b2c6f.firebaseapp.com",
  projectId: "pantry-tracker-b2c6f",
  storageBucket: "pantry-tracker-b2c6f.appspot.com",
  messagingSenderId: "1064654229712",
  appId: "1:1064654229712:web:4f0b4b34bb87f16c358ed5",
  measurementId: "G-RKQZ21F1P0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore}