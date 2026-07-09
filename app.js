// app.js
// ফায়ারবেস কনফিগারেশন এবং অ্যাপ লজিক এখানে থাকবে।
// মনে রাখবেন, এখানে আপনার প্রজেক্টের API Key এবং অন্যান্য তথ্য বসাতে হবে।
const firebaseConfig = {
    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8",
    measurementId: "G-DFDW40QF87"
};

async function bootIndex() {
  // Bombay Gold হোম পেজ লজিক
  console.log("Bombay Gold Index Loaded");
}

async function bootAdmin() {
  // Bombay Gold অ্যাডমিন প্যানেল লজিক
  console.log("Bombay Gold Admin Loaded");
}

window.__SECURE_APP__ = {
  bootIndex,
  bootAdmin
};
