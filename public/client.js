const socket = io();

const usernameInput = document.getElementById("usernameInput");
const joinBtn = document.getElementById("joinBtn");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const notifBtn = document.getElementById("notifBtn");
const notifPanel = document.getElementById("notifPanel");
const notifList = document.getElementById("notifList");
const notifCount = document.getElementById("notifCount");
const themeToggle = document.getElementById("themeToggle");
const adminPanel = document.getElementById("adminPanel");
const banInput = document.getElementById("banInput");
const banBtn = document.getElementById("banBtn");

let username = "";
let notifCounter = 0;
let isAdmin = false;

joinBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (!username) return;
  socket.emit("setUsername", username);
  document.getElementById("loginBox").classList.add("hidden");
  chatBox.classList.remove("hidden");
};

sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (msg) socket.emit("chatMessage", msg);
  msgInput.value = "";
};

socket.on("chatMessage", (data) => {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<strong>${data.user}</strong>: ${data.text} <span class="time">${data.time}</span>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("isAdmin", () => {
  isAdmin = true;
  document.addEventListener("keydown", (e) => {
    if (e.key === "0") adminPanel.classList.toggle("hidden");
  });
});

banBtn.onclick = () => {
  const userToBan = banInput.value.trim();
  if (userToBan) socket.emit("banUser", userToBan);
  banInput.value = "";
};

socket.on("banned", () => {
  alert("You were banned by an admin.");
  location.reload();
});

notifBtn.onclick = () => {
  notifPanel.classList.toggle("hidden");
  notifCount.textContent = "0";
  notifCounter = 0;
};

socket.on("newNotification", (notif) => {
  const li = document.createElement("li");
  li.textContent = notif;
  notifList.appendChild(li);
  notifCounter++;
  notifCount.textContent = notifCounter;
});

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
};
const socket = io();

const usernameInput = document.getElementById("usernameInput");
const joinBtn = document.getElementById("joinBtn");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const notifBtn = document.getElementById("notifBtn");
const notifPanel = document.getElementById("notifPanel");
const notifList = document.getElementById("notifList");
const notifCount = document.getElementById("notifCount");
const themeToggle = document.getElementById("themeToggle");
const adminPanel = document.getElementById("adminPanel");
const banInput = document.getElementById("banInput");
const banBtn = document.getElementById("banBtn");

let username = "";
let notifCounter = 0;
let isAdmin = false;

joinBtn.onclick = () => {
  username = usernameInput.value.trim();
  if (!username) return;
  socket.emit("setUsername", username);
  document.getElementById("loginBox").classList.add("hidden");
  chatBox.classList.remove("hidden");
};

sendBtn.onclick = () => {
  const msg = msgInput.value.trim();
  if (msg) socket.emit("chatMessage", msg);
  msgInput.value = "";
};

socket.on("chatMessage", (data) => {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<strong>${data.user}</strong>: ${data.text} <span class="time">${data.time}</span>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("isAdmin", () => {
  isAdmin = true;
  document.addEventListener("keydown", (e) => {
    if (e.key === "0") adminPanel.classList.toggle("hidden");
  });
});

banBtn.onclick = () => {
  const userToBan = banInput.value.trim();
  if (userToBan) socket.emit("banUser", userToBan);
  banInput.value = "";
};

