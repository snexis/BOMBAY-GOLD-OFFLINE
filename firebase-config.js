// আপনার Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "live-result-b9155.firebaseapp.com",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "YOUR_APP_ID_HERE"
};
// Firebase চালু করা
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
