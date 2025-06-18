// Add the Vesty toggle button to the page
document.addEventListener('DOMContentLoaded', function() {
    // Create the toggle button if it doesn't exist
    if (!document.getElementById('vesty-toggle-btn')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'vesty-toggle-btn';
      toggleBtn.innerHTML = '<span class="vesty-v">V</span>';
      toggleBtn.setAttribute('aria-label', 'Toggle Vesty AI Assistant');
      toggleBtn.style.display = 'flex'; // Ensure button is always visible
      toggleBtn.style.visibility = 'visible';
      toggleBtn.style.opacity = '1';
      toggleBtn.onclick = toggleChat;
      document.body.appendChild(toggleBtn);
    } else {
      // If button already exists, make sure it's visible
      const toggleBtn = document.getElementById('vesty-toggle-btn');
      toggleBtn.style.display = 'flex';
      toggleBtn.style.visibility = 'visible';
      toggleBtn.style.opacity = '1';
    }
    
    // Force the button to be visible after a short delay
    setTimeout(function() {
      const toggleBtn = document.getElementById('vesty-toggle-btn');
      if (toggleBtn) {
        toggleBtn.style.display = 'flex';
        toggleBtn.style.visibility = 'visible';
        toggleBtn.style.opacity = '1';
      }
    }, 500);
    
    // Initialize the chat container state
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      // Set initial state (hidden)
      chatContainer.style.display = 'none';
    }
  });
  
  // Toggle the chat container visibility
  function toggleChat() {
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;
    
    const isVisible = chatContainer.style.display === 'flex';
    
    // Toggle visibility of the chat container only
    chatContainer.style.display = isVisible ? 'none' : 'flex';
    
    // If opening the chat, focus on the input
    if (!isVisible) {
      setTimeout(() => {
        const input = document.getElementById('user-input');
        if (input) input.focus();
      }, 100);
    }
    
    // ALWAYS keep button visible and change state without animation
    const toggleBtn = document.getElementById('vesty-toggle-btn');
    if (toggleBtn) {
      // Force the button to always be visible with multiple CSS properties
      toggleBtn.style.display = 'flex';
      toggleBtn.style.visibility = 'visible';
      toggleBtn.style.opacity = '1';
      toggleBtn.style.zIndex = '9999';
      
      // Change state without rotation
      toggleBtn.classList.toggle('active');
      
      // Force the button to be visible again after a short delay
      setTimeout(() => {
        toggleBtn.style.display = 'flex';
        toggleBtn.style.visibility = 'visible';
        toggleBtn.style.opacity = '1';
      }, 100);
    }
  }
  
  // Make the function available globally
  window.toggleChat = toggleChat;