const socket = io();
let isAdmin = false;

// Set username and server
document.getElementById("setUsernameBtn").addEventListener("click", () => {
  const username = document.getElementById("usernameInput").value.trim();
  if (username) {
    socket.emit("setUsername", username);
  }
});

socket.on("adminStatus", (status) => {
  isAdmin = status;
  if (isAdmin) {
    document.getElementById("adminControls").style.display = "block";
  }
});

socket.on("banned", () => {
  alert("You were banned from the server.");
  window.location.reload();
});

socket.on("serverNotification", (msg) => {
  const notifArea = document.getElementById("notifications");
  const div = document.createElement("div");
  div.textContent = msg;
  notifArea.appendChild(div);
});

// Send messages
document.getElementById("sendBtn").addEventListener("click", () => {
  const msg = document.getElementById("messageInput").value.trim();
  if (msg) {
    socket.emit("sendMessage", msg);
    document.getElementById("messageInput").value = "";
  }
});

socket.on("newMessage", (data) => {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.textContent = `${data.username}: ${data.text}`;
  chat.appendChild(div);
});

// Admin actions
document.getElementById("banBtn").addEventListener("click", () => {
  const target = prompt("Enter username to ban:");
  if (target) socket.emit("banUser", target);
});

document.getElementById("adminBtn").addEventListener("click", () => {
  const target = prompt("Enter username to make admin:");
  if (target) socket.emit("makeAdmin", target);
});
