const socket = io();
let username = "";
let serverCode = "";

// 🌟 Ask for username and server on join
window.addEventListener("load", () => {
  username = prompt("Enter your username:");
  serverCode = prompt("Enter server code to join:");

  if (!username || !serverCode) {
    alert("You must enter a username and server code!");
    location.reload();
  } else {
    socket.emit("joinServer", { username, serverCode });
  }
});

// 📩 Message sending
const msgForm = document.getElementById("msg-form");
const msgInput = document.getElementById("msg-input");
const messages = document.getElementById("messages");
const notifPanel = document.getElementById("notif-panel");
const toggleDarkBtn = document.getElementById("dark-toggle");

// 🔘 Dark mode toggle
toggleDarkBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleDarkBtn.textContent = document.body.classList.contains("dark")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

// 📨 Send message or admin command
msgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = msgInput.value.trim();
  if (!msg) return;

  // 🛠️ Commands
  if (msg.startsWith("/ban ")) {
    const target = msg.split(" ")[1];
    socket.emit("ban", { serverCode, targetUser: target });
  } else if (msg.startsWith("/promote ")) {
    const target = msg.split(" ")[1];
    socket.emit("promote", { serverCode, targetUser: target });
  } else if (msg.startsWith("/kick ")) {
    const target = msg.split(" ")[1];
    socket.emit("ban", { serverCode, targetUser: target });
  } else {
    socket.emit("chatMessage", msg);
  }

  msgInput.value = "";
});

// 💬 Receive chat messages
socket.on("message", (data) => {
  const msgEl = document.createElement("div");
  msgEl.classList.add("message");
  msgEl.innerHTML = `<strong style="color:#004cff">${data.username}</strong>: ${data.text}`;
  messages.appendChild(msgEl);
  messages.scrollTop = messages.scrollHeight;
});

// 🔔 Notifications (joins, bans, promotions, etc.)
socket.on("notification", (data) => {
  const notif = document.createElement("div");
  notif.classList.add("notif");
  notif.textContent = data.message;
  notifPanel.prepend(notif);

  // auto-hide after 6s
  setTimeout(() => notif.remove(), 6000);
});
