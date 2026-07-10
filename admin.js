let currentLiveStatus = false;
let globalMasterPin = "1234"; // ডিফল্ট ব্যাকআপ পিন

// আজকের তারিখ অটো-সেট করা রেজাল্ট এন্ট্রির জন্য
document.getElementById("res-date").valueAsDate = new Date();

// ডাটাবেস থেকে সেটিংসের বর্তমান অবস্থা লোড করা
db.collection("settings").doc("control").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    currentLiveStatus = data.liveStatus || false;
    globalMasterPin = data.masterPin || "1234";

    // ইনপুট ফিল্ডগুলোতে ডাটা সেট করা
    document.getElementById("input-live-text").value = data.liveText || "";
    document.getElementById("input-welcome-note").value = data.welcomeNote || "";
    document.getElementById("input-bg-url").value = data.bgImage || "";
    document.getElementById("input-logo-url").value = data.logoUrl || "";
    document.getElementById("input-master-pin").value = globalMasterPin;

    // লাইভ বাটন আপডেট
    const liveBtn = document.getElementById("btn-live-toggle");
    if (currentLiveStatus) {
      liveBtn.className = "btn-submit";
      liveBtn.innerText = "LIVE ON (চালু আছে)";
    } else {
      liveBtn.className = "btn-danger";
      liveBtn.innerText = "LIVE OFF (বন্ধ আছে)";
    }
  }
});

// লাইভ অন/অফ টগল বাটন ক্লিক লজিক
document.getElementById("btn-live-toggle").addEventListener("click", () => {
  currentLiveStatus = !currentLiveStatus;
  db.collection("settings").doc("control").update({
    liveStatus: currentLiveStatus
  });
});

// জেনারেল সেটিংস সেভ করা
document.getElementById("btn-save-settings").addEventListener("click", () => {
  const liveText = document.getElementById("input-live-text").value;
  const welcomeNote = document.getElementById("input-welcome-note").value;
  const bgImage = document.getElementById("input-bg-url").value;
  const logoUrl = document.getElementById("input-logo-url").value;

  db.collection("settings").doc("control").set({
    liveStatus: currentLiveStatus,
    liveText: liveText,
    welcomeNote: welcomeNote,
    bgImage: bgImage,
    logoUrl: logoUrl,
    masterPin: globalMasterPin
  }, { merge: true }).then(() => {
    alert("সেটিংস সফলভাবে আপডেট হয়েছে!");
  });
});

// সিকিউরিটি মাস্টার পিন পরিবর্তন করা
document.getElementById("btn-save-pin").addEventListener("click", () => {
  const newPin = document.getElementById("input-master-pin").value;
  if(!newPin) return alert("পিন খালি রাখা যাবে না!");
  
  db.collection("settings").doc("control").update({
    masterPin: newPin
  }).then(() => {
    alert("মাস্টার সিকিউরিটি পিন পরিবর্তন সফল!");
  });
});

// রেজাল্ট সাবমিট করা (সবুজ ইফেক্ট এবং ✔ OK এলার্ট সহ)
document.getElementById("btn-submit-result").addEventListener("click", () => {
  const rawDate = document.getElementById("res-date").value;
  const time = document.getElementById("res-time").value;
  const patti = document.getElementById("res-patti").value;
  const single = document.getElementById("res-single").value;

  if (!rawDate || !time) {
    alert("তারিখ এবং টাইম দেওয়া আবশ্যিক!");
    return;
  }

  // তারিখ ফরম্যাট সোজা করা (DD/MM/YYYY)
  const dateObj = new Date(rawDate);
  const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

  const entryBox = document.getElementById("result-entry-box");
  const statusSpan = document.getElementById("submit-status");

  // ফায়ারবেসে ডাটা পুশ করা
  db.collection("results").add({
    date: formattedDate,
    time: time,
    patti: patti,
    single: single,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    // সফল হলে বক্স সবুজ হবে এবং ✔ OK দেখাবে
    entryBox.style.backgroundColor = "#1c5c2e"; 
    statusSpan.style.color = "#28a745";
    statusSpan.innerHTML = "✔ OK (সফলভাবে পুশ হয়েছে)";

    // ফর্ম ক্লিয়ার করা পরবর্তী বাজির জন্য
    document.getElementById("res-time").value = "";
    document.getElementById("res-patti").value = "";
    document.getElementById("res-single").value = "";

    // ৩ সেকেন্ড পর বক্স আবার আগের কালারে ফিরে যাবে
    setTimeout(() => {
      entryBox.style.backgroundColor = "#112233";
      statusSpan.innerHTML = "";
    }, 3000);

  }).catch((error) => {
    alert("ডাটা সেভ করতে সমস্যা হয়েছে: " + error.message);
  });
});

// ডাটাবেস হিস্টোরি লিস্ট লোড এবং মাস্টার পিন ভেরিফাইড ডিলিট সিস্টেম
db.collection("results").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
  const listHolder = document.getElementById("admin-data-list");
  listHolder.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justify = "between";
    row.style.alignItems = "center";
    row.style.padding = "8px";
    row.style.borderBottom = "1px solid #223344";
    row.style.width = "100%";

    row.innerHTML = `
      <div style="flex-grow: 1;">
        <strong>[${data.date}]</strong> ${data.time} ➔ পাত্তি: ${data.patti || '-'} | সিঙ্গেল: ${data.single || '-'}
      </div>
      <button class="btn-danger" style="padding: 4px 10px; font-size:12px;" onclick="deleteResult('${id}')">ডিলিট (Delete)</button>
    `;
    listHolder.appendChild(row);
  });
});

// ডিলিট করার জন্য সিকিউর ফাংশন
window.deleteResult = function(id) {
  const userPin = prompt("এই স্লটটি স্থায়ীভাবে ডিলিট করতে মাস্টার পিন (Master PIN) দিন:");
  
  if (userPin === globalMasterPin) {
    db.collection("results").doc(id).delete().then(() => {
      alert("স্লটটি সফলভাবে ডিলিট করা হয়েছে।");
    });
  } else if (userPin !== null) {
    alert("ভুল মাস্টার পিন! আপনার ডিলিট করার অনুমতি নেই।");
  }
};
