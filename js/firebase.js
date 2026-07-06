// ===============================
// Firebase SDK
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


// ===============================
// Firebase Config
// ===============================

const firebaseConfig = {

    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",

    authDomain: "live-result-b9155.firebaseapp.com",

    projectId: "live-result-b9155",

    storageBucket: "live-result-b9155.firebasestorage.app",

    messagingSenderId: "495121483481",

    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8",

    measurementId: "G-DFDW40QF87"

};


// ===============================
// Initialize Firebase
// ===============================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// ===============================
// Collection Names
// ===============================

const COLLECTION = {

    SETTINGS: "settings",

    LIVE: "liveResults",

    HISTORY: "resultHistory"

};


// ===============================
// Export
// ===============================

export {

    db,

    collection,

    doc,

    setDoc,

    getDoc,

    getDocs,

    updateDoc,

    deleteDoc,

    onSnapshot,

    query,

    orderBy,

    COLLECTION

};
