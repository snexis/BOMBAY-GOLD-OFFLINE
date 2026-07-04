// Firebase Configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  get,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your Firebase Config

const firebaseConfig = {
  apiKey: "AIzaSyDS5w8TPFVLoy1i-RFJlRaCY_8LG9Xmpuw",
  authDomain: "liveresultboard.firebaseapp.com",
  databaseURL: "https://liveresultboard-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "liveresultboard",
  storageBucket: "liveresultboard.firebasestorage.app",
  messagingSenderId: "464276956164",
  appId: "1:464276956164:web:68a0c1b7648e8d9f45c151"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

// Export Everything

export {
  db,
  ref,
  set,
  push,
  update,
  remove,
  get,
  onValue
};
