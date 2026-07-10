import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ফায়ারবেস কনফিগারেশন (এখানে আপনার ডেটা বসাবেন)
<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// সিস্টেম ইনিশিয়ালাইজেশন
export const initSystem = () => {
    // পাবলিক নোটিশ এবং লাইভ স্ট্যাটাস আপডেট লিসেনার
    onSnapshot(doc(db, "settings", "config"), (doc) => {
        const config = doc.data();
        
        // মেইন পেজের লাইভ স্ট্যাটাস ও রেজাল্ট হাইড লজিক
        const liveBtn = document.getElementById('liveButton');
        const resultSec = document.getElementById('resultSection');
        if (liveBtn && resultSec) {
            if (config.isLive) {
                liveBtn.className = "live-status live-on";
                resultSec.classList.remove('hidden');
            } else {
                liveBtn.className = "live-status live-off";
                resultSec.classList.add('hidden');
            }
        }

        // পাবলিক নোটিশ আপডেট
        const noticeBar = document.getElementById('publicNoticeBar');
        if (noticeBar) noticeBar.innerText = config.publicNotice;

        // প্লেয়ার নোটিশ আপডেট
        const playerMsg = document.getElementById('playerMessageBar');
        if (playerMsg) playerMsg.innerText = config.playerMessage;
    });
};

// অ্যাডমিন ফাংশন: রেজাল্ট সেভ ও মাস্টার কন্ট্রোল
export const adminFunctions = {
    toggleLive: async (status) => {
        await updateDoc(doc(db, "settings", "config"), { isLive: !status });
    },
    updateNotices: async (pub, ply) => {
        await updateDoc(doc(db, "settings", "config"), { 
            publicNotice: pub, 
            playerMessage: ply 
        });
    },
    saveResults: async (data) => {
        await updateDoc(doc(db, "results", "data"), { rows: data });
    }
};

// প্লেয়ার লজিক: সাবমিট বেট
export const placeBet = async (betData) => {
    // এখানে আপনার বেট লজিক এবং ওটিপি/ক্যালকুলেশন বসবে
    console.log("Bet Placed:", betData);
};

initSystem();
