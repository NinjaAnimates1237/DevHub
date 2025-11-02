const socket = io();

let username = "";
while (!username) {
  username = prompt("Enter your DevHub username:");
}
socket.emit("setName", username);

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim()) {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

socket.on("chat message", (msg) => {
  const item = document.createElement("div");
  item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
