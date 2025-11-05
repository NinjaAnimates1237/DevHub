// Connect to the server
const socket = io();

// Elements
const form = document.getElementById("msg-form");
const input = document.getElementById("msg-input");
const messages = document.getElementById("messages");
const notifPanel = document.getElementById("notif-panel");
const darkToggle = document.getElementById("dark-toggle");

// Username and Server selection
let username = localStorage.getItem("username");
let serverCode = localStorage.getItem("serverCode");

if (!username) {
  username = prompt("Enter your username:") || "Guest";
  localStorage.setItem("username", username);
}

if (!serverCode) {
  serverCode = prompt("Enter server code to join:") || "global";
  localStorage.setItem("serverCode", serverCode);
}

// Send user info to server
socket.emit("joinServer", { username, serverCode });

// --- DARK MODE TOGGLE ---
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});

// Keep dark mode state saved
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

// --- MESSAGE SEND ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim() !== "") {
    socket.emit("chatMessage", {
      username,
      text: input.value,
      serverCode,
    });
    input.value = "";
  }
});

// --- RECEIVE MESSAGES ---
socket.on("chatMessage", (msg) => {
  addMessage(`${msg.username}: ${msg.text}`);
});

// --- USER JOIN/LEAVE ---
socket.on("userJoin", (user) => {
  addNotification(`${user} joined the server`);
});

socket.on("userLeave", (user) => {
  addNotification(`${user} left the server`);
});

// --- ADMIN ACTIONS (placeholders) ---
socket.on("userBanned", (bannedUser) => {
  if (bannedUser === username) {
    alert("You have been banned from this server.");
    window.location.reload();
  }
  addNotification(`${bannedUser} was banned by an admin.`);
});

// --- FUNCTIONS ---
function addMessage(text) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addNotification(text) {
  const div = document.createElement("div");
  div.classList.add("notif");
  div.textContent = text;
  notifPanel.appendChild(div);
  notifPanel.scrollTop = notifPanel.scrollHeight;
}

// --- RECONNECTION HANDLING ---
socket.on("disconnect", () => {
  addNotification("⚠️ Disconnected from server.");
});

socket.on("connect", () => {
  addNotification("✅ Connected to server.");
});
