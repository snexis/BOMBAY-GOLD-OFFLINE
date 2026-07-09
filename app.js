/**
 * BOMBAY-GOLD MASTER ENGINE
 * ভার্সন: ২.০ (নিরাপদ ও মডুলার)
 */

// ডাটাবেস এবং সিস্টেম কনফিগারেশন
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8"
};

// ফায়ারবেস ইনিশিয়ালাইজেশন
if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

// গ্লোবাল ফাংশন: প্রতিদিনের জন্য আলাদা ডাটাবেস পাথ তৈরি
const getPath = (node) => `${node}/${new Date().toISOString().split('T')[0]}`;

// সিস্টেম মডিউল
const System = {
    // রেজাল্ট আপডেট (অ্যাডমিন)
    updateResult: (time, result) => {
        db.ref(getPath('results')).push({ time, result });
    },
    
    // প্লেয়ার লগইন (নিরাপদ লজিক)
    verifyPlayer: (id, pin) => {
        // এখানে পিন চেক করার কোড হবে (ভবিষ্যতে সার্ভার সাইড সিকিউরিটি যুক্ত হবে)
        console.log("Verifying...", id);
    },
    
    // লাইভ রেজাল্ট লিসেনার
    listenResults: (callback) => {
        db.ref(getPath('results')).on('value', (snap) => callback(snap.val()));
    }
};

// অটো-লোডিং: পেজ অনুযায়ী লজিক রান করা
window.onload = () => {
    // ইনডেক্স পেজের জন্য
    const resultBody = document.getElementById('result-body');
    if (resultBody) {
        System.listenResults((data) => {
            resultBody.innerHTML = "";
            for (let key in data) {
                resultBody.innerHTML += `<tr><td>${data[key].time}</td><td>${data[key].result}</td></tr>`;
            }
        });
    }
};
