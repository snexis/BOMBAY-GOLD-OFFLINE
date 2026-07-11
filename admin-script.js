function toggleResult() {
    db.collection("settings").doc("master").get().then(doc => {
        let status = !doc.data().resultStatus;
        db.collection("settings").doc("master").update({ resultStatus: status });
    });
}
function genDeleteCode() {
    let code = Math.floor(1000 + Math.random() * 9000);
    db.collection("admin").doc("deleteCode").set({ code: code });
    document.getElementById("code-display").innerText = "Code: " + code;
}
