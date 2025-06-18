// Property Management JavaScript Functions

// Analytics Popout Functions
function showAnalyticsPopout(event) {
  event.preventDefault();
  const overlay = document.getElementById('analytics-overlay');
  const popout = document.getElementById('analytics-popout');
  
  overlay.style.display = 'flex';
  popout.style.display = 'block';
  
  setTimeout(() => {
    overlay.classList.add('active');
    popout.classList.add('active');
  }, 10);
  
  // Add event listeners
  document.getElementById('close-analytics-popout').onclick = closeAnalyticsPopout;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeAnalyticsPopout();
  };
  
  // Add escape key listener
  document.addEventListener('keydown', handleAnalyticsEscape);
}

function closeAnalyticsPopout() {
  const overlay = document.getElementById('analytics-overlay');
  const popout = document.getElementById('analytics-popout');
  
  overlay.classList.remove('active');
  popout.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    popout.style.display = 'none';
  }, 300);
  
  document.removeEventListener('keydown', handleAnalyticsEscape);
}

function handleAnalyticsEscape(event) {
  if (event.key === 'Escape') {
    closeAnalyticsPopout();
  }
}

// Timeline Popout Functions
function showTimelinePopout(event) {
  event.preventDefault();
  const overlay = document.getElementById('timeline-overlay');
  const popout = document.getElementById('timeline-popout');
  
  overlay.style.display = 'flex';
  popout.style.display = 'block';
  
  setTimeout(() => {
    overlay.classList.add('active');
    popout.classList.add('active');
  }, 10);
  
  // Add event listeners
  document.getElementById('close-timeline-popout').onclick = closeTimelinePopout;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeTimelinePopout();
  };
  
  document.addEventListener('keydown', handleTimelineEscape);
}

function closeTimelinePopout() {
  const overlay = document.getElementById('timeline-overlay');
  const popout = document.getElementById('timeline-popout');
  
  overlay.classList.remove('active');
  popout.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    popout.style.display = 'none';
  }, 300);
  
  document.removeEventListener('keydown', handleTimelineEscape);
}

function handleTimelineEscape(event) {
  if (event.key === 'Escape') {
    closeTimelinePopout();
  }
}

// Offers Popout Functions
function showOffersPopout(event) {
  event.preventDefault();
  const overlay = document.getElementById('offers-overlay');
  const popout = document.getElementById('offers-popout');
  
  overlay.style.display = 'flex';
  popout.style.display = 'block';
  
  setTimeout(() => {
    overlay.classList.add('active');
    popout.classList.add('active');
  }, 10);
  
  // Add event listeners
  document.getElementById('close-offers-popout').onclick = closeOffersPopout;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeOffersPopout();
  };
  
  // Add offer action listeners
  setupOfferActions();
  
  document.addEventListener('keydown', handleOffersEscape);
}

function closeOffersPopout() {
  const overlay = document.getElementById('offers-overlay');
  const popout = document.getElementById('offers-popout');
  
  overlay.classList.remove('active');
  popout.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    popout.style.display = 'none';
  }, 300);
  
  document.removeEventListener('keydown', handleOffersEscape);
}

function handleOffersEscape(event) {
  if (event.key === 'Escape') {
    closeOffersPopout();
  }
}

function setupOfferActions() {
  const offerButtons = document.querySelectorAll('.offer-btn');
  offerButtons.forEach(button => {
    button.onclick = (e) => {
      e.preventDefault();
      const action = button.classList.contains('accept') ? 'accept' : 
                    button.classList.contains('counter') ? 'counter' : 'decline';
      const offerItem = button.closest('.offer-item');
      const offerAmount = offerItem.querySelector('.offer-amount').textContent;
      
      handleOfferAction(action, offerAmount, button);
    };
  });
}

function handleOfferAction(action, amount, button) {
  // Disable button temporarily
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'Processing...';
  
  // Simulate API call
  setTimeout(() => {
    button.disabled = false;
    button.textContent = originalText;
    
    // Show success message
    showNotification(`Offer ${action} action completed for ${amount}`, 'success');
    
    // Update offer status if needed
    if (action === 'accept') {
      const statusElement = button.closest('.offer-item').querySelector('.offer-status');
      statusElement.textContent = 'Accepted';
      statusElement.className = 'offer-status accepted';
      statusElement.style.background = 'rgba(46, 213, 115, 0.1)';
      statusElement.style.color = '#2ed573';
    }
  }, 1500);
}

// Support Popout Functions
function showSupportPopout(event) {
  event.preventDefault();
  const overlay = document.getElementById('support-overlay');
  const popout = document.getElementById('support-popout');
  
  overlay.style.display = 'flex';
  popout.style.display = 'block';
  
  setTimeout(() => {
    overlay.classList.add('active');
    popout.classList.add('active');
  }, 10);
  
  // Add event listeners
  document.getElementById('close-support-popout').onclick = closeSupportPopout;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeSupportPopout();
  };
  
  document.addEventListener('keydown', handleSupportEscape);
}

function closeSupportPopout() {
  const overlay = document.getElementById('support-overlay');
  const popout = document.getElementById('support-popout');
  
  overlay.classList.remove('active');
  popout.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    popout.style.display = 'none';
  }, 300);
  
  // Hide email form if open
  closeEmailSupport();
  
  document.removeEventListener('keydown', handleSupportEscape);
}

function handleSupportEscape(event) {
  if (event.key === 'Escape') {
    closeSupportPopout();
  }
}

function openEmailSupport() {
  const supportOptions = document.querySelector('.support-options');
  const emailForm = document.getElementById('email-support-form');
  
  supportOptions.style.display = 'none';
  emailForm.style.display = 'block';
  
  // Setup form submission
  const form = emailForm.querySelector('form');
  form.onsubmit = handleSupportFormSubmit;
}

function closeEmailSupport() {
  const supportOptions = document.querySelector('.support-options');
  const emailForm = document.getElementById('email-support-form');
  
  if (supportOptions && emailForm) {
    supportOptions.style.display = 'grid';
    emailForm.style.display = 'none';
    
    // Reset form
    const form = emailForm.querySelector('form');
    if (form) form.reset();
  }
}

function handleSupportFormSubmit(event) {
  event.preventDefault();
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  
  // Show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';
  
  // Get form data
  const formData = new FormData(event.target);
  const subject = document.getElementById('support-subject').value;
  const message = document.getElementById('support-message').value;
  
  // Simulate sending email
  setTimeout(() => {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
    
    showNotification('Support message sent successfully! We\'ll get back to you within 24 hours.', 'success');
    closeSupportPopout();
  }, 2000);
}

// Settings Popout Functions
function showSettingsPopout(event) {
  event.preventDefault();
  const overlay = document.getElementById('settings-overlay');
  const popout = document.getElementById('settings-popout');
  
  overlay.style.display = 'flex';
  popout.style.display = 'block';
  
  setTimeout(() => {
    overlay.classList.add('active');
    popout.classList.add('active');
  }, 10);
  
  // Add event listeners
  document.getElementById('close-settings-popout').onclick = closeSettingsPopout;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeSettingsPopout();
  };
  
  // Setup settings functionality
  setupSettingsHandlers();
  
  document.addEventListener('keydown', handleSettingsEscape);
}

function closeSettingsPopout() {
  const overlay = document.getElementById('settings-overlay');
  const popout = document.getElementById('settings-popout');
  
  overlay.classList.remove('active');
  popout.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    popout.style.display = 'none';
  }, 300);
  
  document.removeEventListener('keydown', handleSettingsEscape);
}

function handleSettingsEscape(event) {
  if (event.key === 'Escape') {
    closeSettingsPopout();
  }
}

function setupSettingsHandlers() {
  // Save changes button
  const saveButton = document.querySelector('.settings-actions .cta-button');
  if (saveButton) {
    saveButton.onclick = handleSettingsSave;
  }
  
  // Reset button
  const resetButton = document.querySelector('.settings-actions .secondary-button');
  if (resetButton) {
    resetButton.onclick = handleSettingsReset;
  }
  
  // Social media links
  const socialLinks = document.querySelectorAll('.view-post-btn');
  socialLinks.forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      showNotification('Opening social media post...', 'info');
      // In a real app, this would open the actual social media post
    };
  });
}

function handleSettingsSave(event) {
  event.preventDefault();
  
  const button = event.target;
  const originalText = button.textContent;
  
  button.disabled = true;
  button.textContent = 'Saving...';
  
  // Get form values
  const displayName = document.getElementById('profile-display-name').value;
  const email = document.getElementById('profile-email').value;
  const phone = document.getElementById('profile-phone').value;
  
  // Simulate saving
  setTimeout(() => {
    button.disabled = false;
    button.textContent = originalText;
    
    // Update the main profile display
    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) {
      userDisplayName.textContent = displayName;
    }
    
    showNotification('Settings saved successfully!', 'success');
  }, 1500);
}

function handleSettingsReset(event) {
  event.preventDefault();
  
  if (confirm('Are you sure you want to reset all settings to default values?')) {
    // Reset form values
    document.getElementById('profile-display-name').value = 'Guest User';
    document.getElementById('profile-email').value = 'user@example.com';
    document.getElementById('profile-phone').value = '(555) 123-4567';
    
    // Reset notification toggles
    const toggles = document.querySelectorAll('.notification-item input[type="checkbox"]');
    toggles.forEach((toggle, index) => {
      // Set default states (first, second, and fourth checked)
      toggle.checked = index === 0 || index === 1 || index === 3;
    });
    
    showNotification('Settings reset to default values', 'info');
  }
}

// Utility Functions
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${getNotificationColor(type)};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    animation: slideInRight 0.3s ease;
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Close button functionality
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.onclick = () => removeNotification(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      removeNotification(notification);
    }
  }, 5000);
}

function removeNotification(notification) {
  notification.style.animation = 'slideOutRight 0.3s ease';
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 300);
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return 'fa-check-circle';
    case 'error': return 'fa-exclamation-circle';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-info-circle';
  }
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#2ed573';
    case 'error': return '#ff4757';
    case 'warning': return '#ffa502';
    default: return '#2a41e8';
  }
}

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    margin-left: 15px;
  }
  
  .notification-close:hover {
    opacity: 0.8;
  }
`;

document.head.appendChild(notificationStyles);

// Documents Popout Functions
function showDocumentsPopout(event) {
  event.preventDefault();
  const overlay = document.getElementById('documents-overlay');
  const popout = document.getElementById('documents-popout');
  
  overlay.style.display = 'flex';
  popout.style.display = 'block';
  
  setTimeout(() => {
    overlay.classList.add('active');
    popout.classList.add('active');
  }, 10);
  
  // Add event listeners
  document.getElementById('close-documents-popout').onclick = closeDocumentsPopout;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeDocumentsPopout();
  };
  
  // Setup file upload
  setupFileUpload();
  
  document.addEventListener('keydown', handleDocumentsEscape);
}

function closeDocumentsPopout() {
  const overlay = document.getElementById('documents-overlay');
  const popout = document.getElementById('documents-popout');
  
  overlay.classList.remove('active');
  popout.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    popout.style.display = 'none';
  }, 300);
  
  document.removeEventListener('keydown', handleDocumentsEscape);
}

function handleDocumentsEscape(event) {
  if (event.key === 'Escape') {
    closeDocumentsPopout();
  }
}

function setupFileUpload() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('document-upload');
  
  // Drag and drop functionality
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#2a41e8';
    uploadArea.style.background = 'rgba(42, 65, 232, 0.1)';
  });
  
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(42, 65, 232, 0.3)';
    uploadArea.style.background = 'rgba(255, 255, 255, 0.8)';
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(42, 65, 232, 0.3)';
    uploadArea.style.background = 'rgba(255, 255, 255, 0.8)';
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  });
  
  fileInput.addEventListener('change', (e) => {
    handleFileUpload(e.target.files);
  });
}

function handleFileUpload(files) {
  Array.from(files).forEach(file => {
    showNotification(`Uploading ${file.name}...`, 'info');
    
    // Simulate upload
    setTimeout(() => {
      showNotification(`${file.name} uploaded successfully!`, 'success');
      addDocumentToGrid(file.name, file.type, file.size);
    }, 2000);
  });
}

function addDocumentToGrid(name, type, size) {
  const grid = document.getElementById('documents-grid');
  const documentItem = document.createElement('div');
  documentItem.className = 'document-item';
  documentItem.onclick = () => openDocumentSplitView(name, type);
  
  const icon = getFileIcon(type);
  const formattedSize = formatFileSize(size);
  const currentDate = new Date().toLocaleDateString();
  
  documentItem.innerHTML = `
    <div class="document-icon">
      <i class="${icon}"></i>
    </div>
    <div class="document-info">
      <h5>${name}</h5>
      <p>${type.toUpperCase()} • ${formattedSize}</p>
      <span class="document-date">${currentDate}</span>
    </div>
  `;
  
  grid.appendChild(documentItem);
}

function getFileIcon(type) {
  if (type.includes('pdf')) return 'fas fa-file-pdf';
  if (type.includes('word') || type.includes('doc')) return 'fas fa-file-word';
  if (type.includes('image')) return 'fas fa-images';
  return 'fas fa-file-alt';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function openDocumentSplitView(documentName, documentType) {
  const splitScreen = document.getElementById('document-split-screen');
  const documentTitle = document.getElementById('document-title');
  const documentContent = document.getElementById('document-viewer-content');
  
  // Close documents popout
  closeDocumentsPopout();
  
  // Set document title
  documentTitle.textContent = documentName;
  
  // Load document content based on type
  loadDocumentContent(documentContent, documentName, documentType);
  
  // Show split screen
  splitScreen.classList.add('active');
  
  // Setup close functionality
  document.getElementById('document-split-close').onclick = closeDocumentSplitView;
  
  // Setup chat functionality
  setupDocumentChat(documentName);
  
  // Add escape key listener
  document.addEventListener('keydown', handleDocumentSplitEscape);
}

function loadDocumentContent(container, name, type) {
  // Simulate loading different document types
  if (type === 'pdf') {
    container.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">${name}</h2>
        <p style="line-height: 1.6; color: #666; margin-bottom: 15px;">
          This is a sample PDF document viewer. In a real application, you would integrate with a PDF viewer library like PDF.js to display the actual document content.
        </p>
        <p style="line-height: 1.6; color: #666; margin-bottom: 15px;">
          The document contains important information about your property transaction, including terms, conditions, and legal requirements.
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #333; margin-bottom: 10px;">Key Points:</h4>
          <ul style="color: #666; line-height: 1.6;">
            <li>Purchase price and payment terms</li>
            <li>Property inspection requirements</li>
            <li>Closing date and conditions</li>
            <li>Contingencies and warranties</li>
          </ul>
        </div>
        <p style="line-height: 1.6; color: #666;">
          Use the chat panel on the right to ask any questions about this document. Our AI assistant can help explain complex terms and conditions.
        </p>
      </div>
    `;
  } else if (type === 'images') {
    container.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">${name}</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <img src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300&h=200" 
               style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" alt="Property Photo 1">
          <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300&h=200" 
               style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" alt="Property Photo 2">
          <img src="https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300&h=200" 
               style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" alt="Property Photo 3">
          <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=300&h=200" 
               style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" alt="Property Photo 4">
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">${name}</h2>
        <p style="line-height: 1.6; color: #666;">
          This document contains important information related to your property transaction. 
          You can ask questions about its content using the chat panel on the right.
        </p>
      </div>
    `;
  }
}

function setupDocumentChat(documentName) {
  const chatInput = document.getElementById('document-chat-input');
  const sendButton = document.getElementById('document-chat-send-button');
  const messagesContainer = document.getElementById('document-chat-messages');
  
  // Clear previous messages except the initial one
  const initialMessage = messagesContainer.querySelector('.assistant-message');
  messagesContainer.innerHTML = '';
  messagesContainer.appendChild(initialMessage);
  
  const sendMessage = () => {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(messagesContainer, message, 'user');
    chatInput.value = '';
    
    // Simulate AI response
    setTimeout(() => {
      const response = generateDocumentResponse(message, documentName);
      addChatMessage(messagesContainer, response, 'assistant');
    }, 1000);
  };
  
  sendButton.onclick = sendMessage;
  chatInput.onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };
}

function addChatMessage(container, message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}-message`;
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${message}</p>
    </div>
  `;
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function generateDocumentResponse(message, documentName) {
  const responses = [
    `Based on the ${documentName}, I can help explain that section. What specific part would you like me to clarify?`,
    `That's a great question about the ${documentName}. This document typically covers important legal and financial aspects of your transaction.`,
    `I can see you're asking about ${documentName}. Let me break down that information for you in simple terms.`,
    `Regarding your question about the ${documentName}, this is a common concern that many property owners have.`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function closeDocumentSplitView() {
  const splitScreen = document.getElementById('document-split-screen');
  splitScreen.classList.remove('active');
  document.removeEventListener('keydown', handleDocumentSplitEscape);
}

function handleDocumentSplitEscape(event) {
  if (event.key === 'Escape') {
    closeDocumentSplitView();
  }
}

// Calendar Popout Functions
function showCalendarPopout(event) {
  event.preventDefault();
  const overlay = document.getElementById('calendar-overlay');
  const popout = document.getElementById('calendar-popout');
  
  overlay.style.display = 'flex';
  popout.style.display = 'block';
  
  setTimeout(() => {
    overlay.classList.add('active');
    popout.classList.add('active');
  }, 10);
  
  // Add event listeners
  document.getElementById('close-calendar-popout').onclick = closeCalendarPopout;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeCalendarPopout();
  };
  
  // Initialize calendar
  initializeCalendar();
  
  document.addEventListener('keydown', handleCalendarEscape);
}

function closeCalendarPopout() {
  const overlay = document.getElementById('calendar-overlay');
  const popout = document.getElementById('calendar-popout');
  
  overlay.classList.remove('active');
  popout.classList.remove('active');
  
  setTimeout(() => {
    overlay.style.display = 'none';
    popout.style.display = 'none';
  }, 300);
  
  // Hide time selection if open
  hideTimeSelection();
  
  document.removeEventListener('keydown', handleCalendarEscape);
}

function handleCalendarEscape(event) {
  if (event.key === 'Escape') {
    closeCalendarPopout();
  }
}

let currentDate = new Date();
let selectedDate = null;
let selectedTimes = [];

function initializeCalendar() {
  generateCalendar();
  setupTimeSlots();
}

function generateCalendar() {
  const grid = document.getElementById('calendar-grid');
  const currentPeriod = document.getElementById('current-period');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  currentPeriod.textContent = new Date(year, month).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Clear previous calendar
  grid.innerHTML = '';
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    grid.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    dayElement.onclick = () => selectDate(year, month, day, dayElement);
    
    // Mark days with existing availability
    if (hasAvailability(year, month, day)) {
      dayElement.classList.add('has-availability');
    }
    
    grid.appendChild(dayElement);
  }
}

function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  generateCalendar();
}

function selectDate(year, month, day, element) {
  // Remove previous selection
  document.querySelectorAll('.calendar-day.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Select new date
  element.classList.add('selected');
  selectedDate = new Date(year, month, day);
  
  // Show time selection
  showTimeSelection();
}

function showTimeSelection() {
  const timeSection = document.getElementById('time-selection-section');
  const dateDisplay = document.getElementById('selected-date-display');
  
  dateDisplay.textContent = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  timeSection.style.display = 'block';
  
  // Reset selected times
  selectedTimes = [];
  document.querySelectorAll('.time-slot.selected').forEach(slot => {
    slot.classList.remove('selected');
  });
}

function hideTimeSelection() {
  const timeSection = document.getElementById('time-selection-section');
  timeSection.style.display = 'none';
  selectedDate = null;
  selectedTimes = [];
}

function setupTimeSlots() {
  const timeSlots = document.querySelectorAll('.time-slot');
  timeSlots.forEach(slot => {
    slot.onclick = () => toggleTimeSlot(slot);
  });
}

function toggleTimeSlot(slot) {
  const time = slot.getAttribute('data-time');
  
  if (slot.classList.contains('selected')) {
    slot.classList.remove('selected');
    selectedTimes = selectedTimes.filter(t => t !== time);
  } else {
    slot.classList.add('selected');
    selectedTimes.push(time);
  }
}

function saveAvailability() {
  if (!selectedDate || selectedTimes.length === 0) {
    showNotification('Please select a date and at least one time slot', 'warning');
    return;
  }
  
  // Add to saved availability
  addSavedAvailability(selectedDate, selectedTimes);
  
  // Update calendar to show availability
  const dayElement = document.querySelector('.calendar-day.selected');
  if (dayElement) {
    dayElement.classList.add('has-availability');
  }
  
  // Hide time selection
  hideTimeSelection();
  
  showNotification(`Availability saved for ${selectedDate.toLocaleDateString()}`, 'success');
}

function cancelTimeSelection() {
  hideTimeSelection();
  
  // Remove selection from calendar
  document.querySelectorAll('.calendar-day.selected').forEach(el => {
    el.classList.remove('selected');
  });
}

function addSavedAvailability(date, times) {
  const container = document.getElementById('saved-slots-container');
  
  const slotItem = document.createElement('div');
  slotItem.className = 'saved-slot-item';
  
  const dateString = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const timeBadges = times.map(time => 
    `<span class="time-badge">${time}</span>`
  ).join('');
  
  slotItem.innerHTML = `
    <div class="slot-date">
      <i class="fas fa-calendar"></i>
      <span>${dateString}</span>
    </div>
    <div class="slot-times">
      ${timeBadges}
    </div>
    <button class="remove-slot-btn" onclick="removeSlot(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  container.appendChild(slotItem);
}

function removeSlot(button) {
  const slotItem = button.closest('.saved-slot-item');
  slotItem.remove();
  showNotification('Availability slot removed', 'info');
}

function hasAvailability(year, month, day) {
  // This would check against saved availability data
  // For demo purposes, return true for some random dates
  return (day % 7 === 0 || day % 11 === 0);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Property Management system initialized');
  
  // Add hover effects to chart bars
  const chartBars = document.querySelectorAll('.chart-bar');
  chartBars.forEach(bar => {
    bar.addEventListener('mouseenter', function() {
      const value = this.getAttribute('data-value');
      if (value) {
        this.setAttribute('title', `${value} views`);
      }
    });
  });
}); 