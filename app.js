// ১. ফায়ারবেস কনফিগারেশন (আপনার কনসোল থেকে পাওয়া কপি করা অংশ এখানে বসান)
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

// ফায়ারবেস ইনিশিয়ালাইজ করা
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ২. ইনডেক্স পেজের জন্য রেজাল্ট দেখানো
if (document.getElementById('result-body')) {
    database.ref('results').on('value', (snapshot) => {
        const tbody = document.getElementById('result-body');
        tbody.innerHTML = ""; // টেবিল রিসেট করা
        
        const data = snapshot.val();
        for (let key in data) {
            let row = `<tr>
                        <td>${data[key].time}</td>
                        <td>${data[key].result}</td>
                       </tr>`;
            tbody.innerHTML += row;
        }
    });

    // আজকের তারিখ অটোমেটিক সেট করা
    document.getElementById('result-date').innerText = "BOMBAY-GOLD Live Result " + new Date().toLocaleDateString();
}

// ৩. অ্যাডমিন পেজের জন্য ডেটা সেভ করা
if (document.getElementById('add-result-btn')) {
    document.getElementById('add-result-btn').addEventListener('click', () => {
        const time = document.getElementById('time-input').value;
        const result = document.getElementById('result-input').value;

        if (time && result) {
            database.ref('results/' + Date.now()).set({
                time: time,
                result: result
            }).then(() => alert("রেজাল্ট সফলভাবে যোগ হয়েছে!"));
        } else {
            alert("সব ঘর পূরণ করুন");
        }
    });
}
