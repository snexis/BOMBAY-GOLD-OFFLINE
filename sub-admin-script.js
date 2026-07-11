function generateRows() {
    const container = document.getElementById("entry-area");
    container.innerHTML = "";
    let count = document.getElementById("row-count").value;
    for(let i=0; i<count; i++) {
        container.innerHTML += `<div class="row"><input placeholder="Time"><input placeholder="Patti"><input placeholder="Single"><button onclick="this.style.background='green'; this.innerText='OK'">Submit</button></div>`;
    }
}
