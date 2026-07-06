// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
  authDomain: "live-result-b9155.firebaseapp.com",
  projectId: "live-result-b9155",
  storageBucket: "live-result-b9155.firebasestorage.app",
  messagingSenderId: "495121483481",
  appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8",
  measurementId: "G-DFDW40QF87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore Database
const db = getFirestore(app);

// Export
export { db };
