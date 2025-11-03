const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const typing = document.getElementById("typing");

let typingTimeout;
const username = "User" + Math.floor(Math.random() * 1000);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", `${username}: ${input.value}`);
    input.value = "";
    socket.emit("stop typing");
  }
});

input.addEventListener("input", () => {
  socket.emit("typing", username);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("stop typing"), 1000);
});

socket.on("chat message", (msg) => {
  const li = document.createElement("li");
  li.textContent = msg;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("typing", (user) => {
  typing.textContent = `${user} is typing...`;
});

socket.on("stop typing", () => {
  typing.textContent = "";
});
