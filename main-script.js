db.collection("settings").doc("master").onSnapshot(doc => {
    const isLive = doc.data().resultStatus;
    document.getElementById("live-dot").style.background = isLive ? "green" : "red";
    document.getElementById("result-board").style.display = isLive ? "block" : "none";
});
