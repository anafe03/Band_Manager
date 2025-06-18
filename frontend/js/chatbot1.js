let chatOpened = false;
let chatHistory = JSON.parse(localStorage.getItem("vestyChat")) || [];


function toggleChat() {
  const chatWindow = document.getElementById("chat-window");
  const isOpening = (chatWindow.style.display === "none" || chatWindow.style.display === "");
  
  chatWindow.style.display = isOpening ? "flex" : "none";
  
  if (isOpening && !chatOpened) {
    chatOpened = true;
    appendRobotGreeting();
  }
}

function appendRobotGreeting() {
  const chatBox = document.getElementById("chat-box");
  const robotDiv = document.createElement("div");
  robotDiv.classList.add("message", "agent");
  robotDiv.innerHTML = `
    <div class="robot-wave">
      <span class="wave-hand">👋</span>
      <strong>Hi! I'm Vesty.</strong><br>
      Ask me anything about investing, planning, or getting started!
    </div>`;
  chatBox.appendChild(robotDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Add event listener for Enter key when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => { chatHistory.forEach(msg => appendMessage(msg.sender, msg.text));
});
document.getElementById("user-input").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents accidental form submission
      sendMessage(); // Call sendMessage function
    }
  });


async function sendMessage() {
    const input = document.getElementById("user-input");
    const message = input.value.trim();
    if (!message) return;
  
    appendMessage("user", message);
    input.value = "";
  
    // Show typing loader
    const loaderId = appendLoader();
  
    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
  
      const data = await response.json();
  
      // Remove loader and add response
      removeLoader(loaderId);
      appendMessage("agent", data.reply || "Vesty didn’t respond.");
    } catch (err) {
      removeLoader(loaderId);
      appendMessage("agent", "Oops! Something went wrong.");
    }
  }
  
  function appendMessage(sender, text) {
    const chatBox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Save chat history
    chatHistory.push({ sender, text });
    localStorage.setItem("vestyChat", JSON.stringify(chatHistory));
  }

  function clearChat() {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    chatHistory = [];
    localStorage.removeItem("vestyChat");
  }
  
  function appendLoader() {
    const chatBox = document.getElementById("chat-box");
    const loaderId = "loader-" + Date.now();
    const loaderDiv = document.createElement("div");
    loaderDiv.id = loaderId;
    loaderDiv.classList.add("message", "agent");
    loaderDiv.textContent = "Vesty is thinking...";
    chatBox.appendChild(loaderDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return loaderId;
  }
  
  function removeLoader(loaderId) {
    const loaderDiv = document.getElementById(loaderId);
    if (loaderDiv) loaderDiv.remove();
  }
  