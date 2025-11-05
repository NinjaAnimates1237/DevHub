const socket = io();
let username = "";
let serverId = "";

function joinServer() {
  username = document.getElementById("username").value.trim();
  serverId = document.getElementById("serverId").value.trim();
  if (!username || !serverId) return alert("Enter username & server ID!");

  socket.emit("joinServer", { username, serverId });
  document.getElementById("joinForm").style.display = "none";
  document.getElementById("chat").style.display = "flex";
  document.getElementById("serverIdDisplay").textContent = "Server ID: " + serverId;
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;
  socket.emit("sendMessage", { username, serverId, message });
  input.value = "";
}

socket.on("chatMessage", (msg) => {
  const div = document.createElement("div");
  div.textContent = `${msg.username}: ${msg.message}`;
  document.getElementById("messages").appendChild(div);
});

socket.on("notification", (text) => {
  const div = document.createElement("div");
  div.textContent = `🔔 ${text}`;
  div.style.color = "#00bfff";
  document.getElementById("messages").appendChild(div);
});

socket.on("chatHistory", (history) => {
  const box = document.getElementById("messages");
  box.innerHTML = "";
  history.forEach((msg) => {
    const div = document.createElement("div");
    div.textContent = `${msg.username}: ${msg.message}`;
    box.appendChild(div);
  });
});

