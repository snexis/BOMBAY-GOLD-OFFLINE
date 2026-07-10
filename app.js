// App.js - সেন্ট্রাল সিস্টেম কন্ট্রোলার
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, transaction, serverTimestamp } from 'firebase/database';

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// অটো-রিসেট লজিক: প্রতিদিন রাত ১২টায় লাইভ সেশন ও বেট পরিষ্কার হবে
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  setTimeout(() => {
    remove(ref(db, 'Live_Session'));
    remove(ref(db, 'bets'));
    scheduleMidnightReset();
  }, midnight - now);
}
scheduleMidnightReset();

// উইনিং ক্যালকুলেটর: সিঙ্গেল (x9) ও পাত্তি (x11.5)
export const processGameResults = (resultData) => {
  const betsRef = ref(db, 'bets');
  onValue(betsRef, (snapshot) => {
    const allBets = snapshot.val();
    if (!allBets) return;

    Object.entries(allBets).forEach(([userId, userBets]) => {
      Object.values(userBets).forEach(bet => {
        let win = 0;
        if (bet.patti === resultData.patti) win = bet.amount * 11.5;
        else if (bet.single === resultData.result) win = bet.amount * 9;

        if (win > 0) {
          transaction(ref(db, `wallets/${userId}/winningBalance`), (cur) => (cur || 0) + win);
        }
      });
    });
  }, { onlyOnce: true });
};

export { db };
