// Frontend JavaScript for the chatbot with improved memory management
//const API_BASE = "/api/langgraph";

// if you keep front and back in separate Render services
const API_BASE = "https://vesty-app-fastapi.onrender.com/api/langgraph";

let THREAD_ID = localStorage.getItem("thread_id") || null;
let isProcessing = false;

// Initialize the application
async function initializeApp() {
    console.log("Initializing chatbot...");
  
    // 👇 Force chat popup to show on page load
    const chatWindow = document.querySelector(".chat-container");
    const toggleBtn = document.getElementById("vesty-toggle-btn");
    
    if (chatWindow) {
      chatWindow.style.display = "flex";
      // Hide the toggle button initially since chat is open
      if (toggleBtn) {
        toggleBtn.style.display = "none";
      }
    }
  
    // Restore thread if available
    if (THREAD_ID) {
      console.log("Found existing thread:", THREAD_ID);
      await loadConversationHistory();
    } else {
      console.log("No existing thread found, will create on first message");
      displayWelcomeMessage();
    }
  
    // Set up input and button events
    setupEventListeners();
  }
  
  function toggleChat() {
    const chatWindow = document.querySelector(".chat-container");
    const toggleBtn = document.getElementById("vesty-toggle-btn");
    if (!chatWindow || !toggleBtn) return;
  
    const isOpen = chatWindow.style.display === "flex";
  
    // flip visibility
    chatWindow.style.display = isOpen ? "none" : "flex";
    toggleBtn.style.display = isOpen ? "flex" : "none";
  
    // if we're opening, focus the textarea
    if (!isOpen) {
      setTimeout(() => {
        const input = document.getElementById("user-input");
        if (input) input.focus();
      }, 100);
    }
  }
  
// Add event listener for hovering over the toggle button
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  setupImageUpload();
  setupTextareaAutoResize();
});

// Setup textarea auto-resize
function setupTextareaAutoResize() {
    const textarea = document.getElementById('user-input');
    if (!textarea) return;
    
    // Initial resize
    autoResizeTextarea(textarea);
    
    // Resize on input
    textarea.addEventListener('input', () => {
        autoResizeTextarea(textarea);
    });
    
    // Handle Enter key for sending (Shift+Enter for new line)
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Add event listener for hovering over the toggle button
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById("vesty-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener('mouseenter', function() {
      toggleChat();
    });
  }
});
  
// Also expose this for HTML to use if needed
window.toggleChat = toggleChat;


// Display a welcome message
function displayWelcomeMessage() {
    appendMessage("Vesty", "Hello! I'm Vesty, your AI assistant. How can I help you today?", "assistant");
}

// Set up event listeners
function setupEventListeners() {
    const input = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    
    // Send message on Enter key
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button click
    sendButton.onclick = sendMessage;
    
    // Focus input on page load
    input.focus();
}

// Create a new thread
async function createThread() {
    try {
        console.log("Creating new thread...");
        const response = await fetch(`${API_BASE}/thread`, { 
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        THREAD_ID = data.thread_id;
        localStorage.setItem("thread_id", THREAD_ID);
        console.log("Created new thread:", THREAD_ID);
        return THREAD_ID;
    } catch (error) {
        console.error("Failed to create thread:", error);
        throw error;
    }
}
async function loadConversationHistory() {
    if (!THREAD_ID) return;

    try {
        console.log("Loading conversation history for thread:", THREAD_ID);
        const response = await fetch(`${API_BASE}/history?thread_id=${THREAD_ID}`);

        if (!response.ok) {
            if (response.status === 404) {
                // Thread doesn't exist anymore, clear it and create new one
                console.log("Thread not found, clearing stored thread ID");
                localStorage.removeItem("thread_id");
                THREAD_ID = null;

                console.log("Creating new thread due to missing history...");
                await createThread();
                displayWelcomeMessage();
                return;
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (Array.isArray(data.messages) && data.messages.length > 0) {
            const messagesDiv = document.getElementById("messages");
            messagesDiv.innerHTML = ""; // Clear existing messages

            // Render all messages from history
            for (const msg of data.messages) {
                const senderName = msg.role === "user" ? "You" : "Vesty";
                appendMessage(senderName, msg.content, msg.role, false); // false = don't animate
            }

            console.log(`Loaded ${data.messages.length} messages from history`);
        } else {
            console.log("No message history found");
            displayWelcomeMessage();
        }
    } catch (error) {
        console.error("Failed to load conversation history:", error);
        displayWelcomeMessage();
    }
}

// Handle image upload
function setupImageUpload() {
    const imageUploadBtn = document.querySelector('.image-upload-btn');
    const imagePreview = document.querySelector('.image-preview');
    
    if (!imageUploadBtn) return;
    
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Handle click on image upload button
    imageUploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            imagePreview.style.display = 'flex';
            
            // Process each selected file
            Array.from(fileInput.files).forEach(file => {
                // Create preview item
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                
                // Create image element
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                previewItem.appendChild(img);
                
                // Create remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'image-preview-remove';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    previewItem.remove();
                    
                    // Hide preview container if no images left
                    if (imagePreview.children.length === 0) {
                        imagePreview.style.display = 'none';
                    }
                });
                previewItem.appendChild(removeBtn);
                
                // Add to preview container
                imagePreview.appendChild(previewItem);
            });
            
            // Reset file input
            fileInput.value = '';
        }
    });
}

// Send a message
async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    const imagePreview = document.querySelector('.image-preview');
    const hasImages = imagePreview && imagePreview.children.length > 0;
    
    if ((!text && !hasImages) || isProcessing) return;
    
    // Prevent multiple simultaneous requests
    isProcessing = true;
    updateSendButton(true);
    
    // Prepare message content
    let messageContent = text;
    let messageHTML = text;
    
    // Handle images if present
    if (hasImages) {
        // For display in UI
        messageHTML += '<div class="attached-images">';
        Array.from(imagePreview.children).forEach(item => {
            const img = item.querySelector('img');
            messageHTML += `<div class="attached-image"><img src="${img.src}" alt="Attached image"></div>`;
        });
        messageHTML += '</div>';
        
        // Clear image preview
        imagePreview.innerHTML = '';
        imagePreview.style.display = 'none';
    }
    
    // Add user message to UI
    appendMessage("You", messageHTML, "user", true);
    input.value = "";
    
    // Auto-resize textarea
    autoResizeTextarea(input);
    
    // Show typing indicator
    const typingIndicatorId = appendTypingIndicator();
    
    try {
        // Create thread if we don't have one
        if (!THREAD_ID) {
            await createThread();
        }
        
        console.log("Sending message to thread:", THREAD_ID);
        
        const response = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                ...(window.auth && window.auth.isAuthenticated() ? 
                    { 'Authorization': `Bearer ${window.authState.token}` } : {})
            },
            body: JSON.stringify({ 
                message: text, 
                thread_id: THREAD_ID 
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update thread ID if provided (in case it was created during this request)
        if (data.thread_id && data.thread_id !== THREAD_ID) {
            THREAD_ID = data.thread_id;
            localStorage.setItem("thread_id", THREAD_ID);
            console.log("Updated thread ID:", THREAD_ID);
        }
        
        // Remove typing indicator
        removeTypingIndicator(typingIndicatorId);
        
        // Add assistant response
        const assistantMessage = data.response || "I'm sorry, I couldn't process that request.";
        appendMessage("Vesty", assistantMessage, "assistant");
        
        console.log("Message sent successfully");
        
    } catch (error) {
        console.error("Failed to send message:", error);
        removeTypingIndicator(typingIndicatorId);
        
        let errorMessage = "❌ I'm having trouble connecting right now. Please try again in a moment.";
        
        if (error.message.includes("504")) {
            errorMessage = "❌ I'm taking longer than usual to respond. Please try again.";
        } else if (error.message.includes("500")) {
            errorMessage = "❌ I encountered an internal error. Please try again.";
        }
        
        appendMessage("Vesty", errorMessage, "assistant");
    } finally {
        isProcessing = false;
        updateSendButton(false);
        input.focus(); // Refocus input for next message
    }
}

// Update send button state
function updateSendButton(disabled) {
    const sendButton = document.getElementById("send-button");
    const input = document.getElementById("user-input");
    
    sendButton.disabled = disabled;
    input.disabled = disabled;
    
    if (disabled) {
        sendButton.querySelector('i').style.opacity = "0.6";
    } else {
        sendButton.querySelector('i').style.opacity = "1";
    }
}

// Auto-resize textarea as user types
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    
    // Reset height to calculate scroll height correctly
    textarea.style.height = 'auto';
    
    // Set new height based on content (with max height constraint handled by CSS)
    const newHeight = Math.min(textarea.scrollHeight, 100);
    textarea.style.height = newHeight + 'px';
}

// Append a message to the chat
function appendMessage(sender, content, type, isHTML = false) {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (isHTML) {
        messageContent.innerHTML = content;
    } else {
        messageContent.innerHTML = formatMessage(content);
    }
    
    messageElement.appendChild(messageContent);
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageElement;
}

// Format message text (basic formatting)
function formatMessage(text) {
    if (!text) return "";
    
    // Basic text formatting
    return text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

// Add typing indicator
function appendTypingIndicator() {
    const messagesDiv = document.getElementById("messages");
    const typingDiv = document.createElement("div");
    
    typingDiv.className = "message assistant typing";
    typingDiv.innerHTML = `
        <strong>Vesty:</strong> 
        <span class="typing-dots">
            <span>.</span><span>.</span><span>.</span>
        </span>
        <em>thinking...</em>
    `;
    
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return typingDiv;
}

// Remove typing indicator
function removeTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
        typingDiv.remove();
    }
}

// Clear conversation
async function clearConversation() {
    if (confirm("Are you sure you want to clear this conversation? This action cannot be undone.")) {
        try {
            // Clear the UI
            const messagesDiv = document.getElementById("messages");
            messagesDiv.innerHTML = "";
            
            // Clear stored thread
            if (THREAD_ID) {
                localStorage.removeItem("thread_id");
                // Optionally delete the thread on the server
                try {
                    await fetch(`${API_BASE}/thread/${THREAD_ID}`, { method: "DELETE" });
                } catch (error) {
                    console.warn("Failed to delete thread on server:", error);
                }
                THREAD_ID = null;
            }
            
            // Show welcome message
            displayWelcomeMessage();
            
            console.log("Conversation cleared");
        } catch (error) {
            console.error("Error clearing conversation:", error);
        }
    }
}

// Export functions for potential use in HTML
window.clearConversation = clearConversation;
window.sendMessage = sendMessage;

// Initialize when page loads
window.addEventListener('load', initializeApp);

// Add some CSS for typing animation
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        display: inline-block;
    }
    
    .typing-dots span {
        animation: typing 1.4s infinite;
        opacity: 0;
    }
    
    .typing-dots span:nth-child(1) { animation-delay: 0s; }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing {
        0%, 60%, 100% { opacity: 0; }
        30% { opacity: 1; }
    }
    
    .message {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        max-width: 80%;
        word-wrap: break-word;
    }
    
    .message.user {
        background-color: #007bff;
        color: white;
        margin-left: auto;
        text-align: right;
    }
    
    .message.assistant {
        background-color: #f8f9fa;
        color: #333;
        border: 1px solid #dee2e6;
    }
    
    .message.typing {
        opacity: 0.7;
    }
`;
document.head.appendChild(style);


