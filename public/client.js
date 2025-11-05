const socket = io();

// Elements
const form = document.getElementById("msg-form");
const input = document.getElementById("msg-input");
const messages = document.getElementById("messages");
const notifPanel = document.getElementById("notif-panel");
const notifBtn = document.getElementById("notif-btn");
const darkToggle = document.getElementById("dark-toggle");
const serverCodeDisplay = document.getElementById("server-code-display");

// Username & server
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

serverCodeDisplay.textContent = serverCode;

// Connect to the right server
socket.emit("joinServer", { username, serverCode });

// --- DARK MODE ---
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
});
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
}

// --- TOGGLE NOTIFICATIONS PANEL ---
notifBtn.addEventListener("click", () => {
  notifPanel.classList.toggle("hidden");
});

// --- SEND MESSAGE ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim() !== "") {
    socket.emit("chatMessage", { username, text: input.value, serverCode });
    input.value = "";
  }
});

// --- RECEIVE MESSAGE ---
socket.on("chatMessage", (msg) => {
  addMessage(`${msg.username}: ${msg.text}`);
  if (msg.username !== username) {
    addNotification(`${msg.username} has messaged you.`);
  }
});

// --- USER EVENTS ---
socket.on("userJoin", (user) => {
  addNotification(`${user} joined the server.`);
});
socket.on("userLeave", (user) => {
  addNotification(`${user} left the server.`);
});

// --- ADMIN EVENTS ---
socket.on("userBanned", (bannedUser, adminUser) => {
  if (bannedUser === username) {
    addNotification(`You were banned by ${adminUser}.`);
    alert("You have been banned from this server.");
    window.location.reload();
  } else {
    addNotification(`${adminUser} has banned ${bannedUser}.`);
  }
});

socket.on("userPromoted", (targetUser, adminUser) => {
  if (targetUser === username) {
    addNotification(`${adminUser} gave you admin privileges.`);
  } else {
    addNotification(`${targetUser} was promoted by ${adminUser}.`);
  }
});

// --- UTIL FUNCTIONS ---
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
}

// --- CONNECTION EVENTS ---
socket.on("disconnect", () => addNotification("⚠️ Disconnected."));
socket.on("connect", () => addNotification("✅ Connected."));
