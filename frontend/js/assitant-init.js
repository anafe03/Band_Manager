// Assistant Page Initialization
// This file is: assistant-init.js

// Menu system setup
function setupMenuSystem() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach((item, index) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
  
        // Remove active from all items
        menuItems.forEach(mi => mi.classList.remove('active'));
        // Add active to clicked item
        item.classList.add('active');
  
        // Handle menu clicks
        switch(index) {
          case 0: // Chat - close all popups
            closeAllPopups();
            break;
          case 1: // Documents - show documents popout
            closeAllPopups();
            showDocumentsPopout(event);
            break;
          case 2: // Calendar - show calendar popout
            closeAllPopups();
            showCalendarPopout(event);
            break;
        }
      });
    });
  }
  
  // Show Documents Popout
  function showDocumentsPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const documentsPopout = document.getElementById('documents-popout');
    const documentsOverlay = document.getElementById('documents-overlay');
    
    if (documentsPopout && documentsOverlay) {
      documentsPopout.classList.add('active');
      documentsOverlay.classList.add('active');
      
      // Load documents when popout opens
      if (typeof documentManager !== 'undefined') {
        documentManager.loadStaticDocuments();
      }
    }
  }
  
  // Show Properties Popout
  function showPropertyPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const propertyPopout = document.getElementById('property-popout');
    const propertyOverlay = document.getElementById('property-overlay');
    
    if (propertyPopout && propertyOverlay) {
      propertyPopout.classList.add('active');
      propertyOverlay.classList.add('active');
      
      // Load properties when popout opens
      if (typeof propertyManager !== 'undefined') {
        propertyManager.displayProperties();
      }
    }
  }
  
  // Show Calendar Popout
  function showCalendarPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const calendarPopout = document.getElementById('calendar-popout');
    const calendarOverlay = document.getElementById('calendar-overlay');
    
    if (calendarPopout && calendarOverlay) {
      calendarPopout.classList.add('active');
      calendarOverlay.classList.add('active');
      
      // Initialize calendar when popout opens
      if (typeof calendarManager !== 'undefined' && calendarManager) {
        calendarManager.initPopoutCalendar();
      } else {
        console.warn('Calendar manager not available, trying to initialize...');
        // Try to initialize after a short delay
        setTimeout(() => {
          if (typeof calendarManager !== 'undefined' && calendarManager) {
            calendarManager.initPopoutCalendar();
          } else {
            console.error('Calendar manager still not available');
          }
        }, 100);
      }
    }
  }
  
  // Show Property Details Popout
  function showPropertyDetailsPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const propertyDetailsPopout = document.getElementById('property-details-popout');
    const propertyDetailsOverlay = document.getElementById('property-details-overlay');
    
    if (propertyDetailsPopout && propertyDetailsOverlay) {
      propertyDetailsPopout.classList.add('active');
      propertyDetailsOverlay.classList.add('active');
      
      // Initialize property chat functionality
      initializePropertyChat();
    }
  }
  
  // Initialize Property Chat
  function initializePropertyChat() {
    const chatInput = document.getElementById('property-chat-input');
    const sendButton = document.getElementById('property-chat-send-button');
    const messagesContainer = document.getElementById('property-chat-messages');
    
    if (chatInput && sendButton && messagesContainer) {
      // Remove existing event listeners to prevent duplicates
      const newSendButton = sendButton.cloneNode(true);
      sendButton.parentNode.replaceChild(newSendButton, sendButton);
      
      const newChatInput = chatInput.cloneNode(true);
      chatInput.parentNode.replaceChild(newChatInput, chatInput);
      
      // Handle send button click
      newSendButton.addEventListener('click', function() {
        sendPropertyChatMessage();
      });
      
      // Handle enter key press
      newChatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendPropertyChatMessage();
        }
      });
    }
  }
  
  // Send Property Chat Message
  function sendPropertyChatMessage() {
    const chatInput = document.getElementById('property-chat-input');
    const messagesContainer = document.getElementById('property-chat-messages');
    
    if (!chatInput || !messagesContainer) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    userMessage.innerHTML = `
      <div class="message-content">
        <p>${message}</p>
      </div>
    `;
    messagesContainer.appendChild(userMessage);
    
    // Clear input
    chatInput.value = '';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const responses = [
        "This property features a beautiful open floor plan perfect for entertaining guests.",
        "The kitchen has been recently updated with granite countertops and stainless steel appliances.",
        "The master bedroom includes a walk-in closet and en-suite bathroom with dual vanities.",
        "The backyard is spacious and includes a deck perfect for outdoor dining.",
        "This home is located in a highly rated school district with excellent amenities nearby.",
        "The property includes a 2-car garage with additional storage space.",
        "Recent improvements include new hardwood floors and fresh paint throughout."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage = document.createElement('div');
      aiMessage.className = 'chat-message assistant-message';
      aiMessage.innerHTML = `
        <div class="message-content">
          <p>${randomResponse}</p>
        </div>
      `;
      messagesContainer.appendChild(aiMessage);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
  }
  
    // Close all popups
  function closeAllPopups() {
    // Close documents popout
    const documentsPopout = document.getElementById('documents-popout');
    const documentsOverlay = document.getElementById('documents-overlay');
    if (documentsPopout && documentsOverlay) {
      documentsPopout.classList.remove('active');
      documentsOverlay.classList.remove('active');
    }

    // Close property popout
    const propertyPopout = document.getElementById('property-popout');
    const propertyOverlay = document.getElementById('property-overlay');
    if (propertyPopout && propertyOverlay) {
      propertyPopout.classList.remove('active');
      propertyOverlay.classList.remove('active');
    }

    // Close property details popout
    const propertyDetailsPopout = document.getElementById('property-details-popout');
    const propertyDetailsOverlay = document.getElementById('property-details-overlay');
    if (propertyDetailsPopout && propertyDetailsOverlay) {
      propertyDetailsPopout.classList.remove('active');
      propertyDetailsOverlay.classList.remove('active');
    }

    // Close calendar popout
    const calendarPopout = document.getElementById('calendar-popout');
    const calendarOverlay = document.getElementById('calendar-overlay');
    if (calendarPopout && calendarOverlay) {
      calendarPopout.classList.remove('active');
      calendarOverlay.classList.remove('active');
    }

    // Close analytics popout
    const analyticsPopout = document.getElementById('analytics-popout');
    const analyticsOverlay = document.getElementById('analytics-overlay');
    if (analyticsPopout && analyticsOverlay) {
      analyticsPopout.classList.remove('active');
      analyticsOverlay.classList.remove('active');
    }

    // Close timeline popout
    const timelinePopout = document.getElementById('timeline-popout');
    const timelineOverlay = document.getElementById('timeline-overlay');
    if (timelinePopout && timelineOverlay) {
      timelinePopout.classList.remove('active');
      timelineOverlay.classList.remove('active');
    }

    // Close offers popout
    const offersPopout = document.getElementById('offers-popout');
    const offersOverlay = document.getElementById('offers-overlay');
    if (offersPopout && offersOverlay) {
      offersPopout.classList.remove('active');
      offersOverlay.classList.remove('active');
    }

    // Close support popout
    const supportPopout = document.getElementById('support-popout');
    const supportOverlay = document.getElementById('support-overlay');
    if (supportPopout && supportOverlay) {
      supportPopout.classList.remove('active');
      supportOverlay.classList.remove('active');
    }

    // Close settings popout
    const settingsPopout = document.getElementById('settings-popout');
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsPopout && settingsOverlay) {
      settingsPopout.classList.remove('active');
      settingsOverlay.classList.remove('active');
    }

    // Close split-screen document viewer
    const splitScreenContainer = document.getElementById('split-screen-container');
    if (splitScreenContainer) {
      splitScreenContainer.classList.remove('active');
    }

    // Close property split-screen
    const propertySplitScreen = document.getElementById('property-split-screen');
    if (propertySplitScreen) {
      propertySplitScreen.classList.remove('active');
    }
  }
  
  // Close all popups with Escape key
  function setupEscapeKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllPopups();
      }
    });
  }
  
  // Global utility function
  function usesuggestion(button) {
    const chatInput = document.getElementById('user-input');
    if (chatInput && button) {
      chatInput.value = button.textContent;
      if (typeof sendMessage === 'function') {
        sendMessage();
      }
    }
  }
  
  // Setup close button event listeners
  function setupCloseButtons() {
    // Documents close button
    const documentsCloseBtn = document.getElementById('close-documents-popout');
    if (documentsCloseBtn) {
      documentsCloseBtn.addEventListener('click', closeAllPopups);
    }
    
    // Calendar close button
    const calendarCloseBtn = document.getElementById('close-calendar-popout');
    if (calendarCloseBtn) {
      calendarCloseBtn.addEventListener('click', closeAllPopups);
    }
    
    // Property details close button
    const propertyDetailsCloseBtn = document.getElementById('close-property-details-popout');
    if (propertyDetailsCloseBtn) {
      propertyDetailsCloseBtn.addEventListener('click', closeAllPopups);
    }

    // Analytics close button
    const analyticsCloseBtn = document.getElementById('close-analytics-popout');
    if (analyticsCloseBtn) {
      analyticsCloseBtn.addEventListener('click', closeAllPopups);
    }

    // Timeline close button
    const timelineCloseBtn = document.getElementById('close-timeline-popout');
    if (timelineCloseBtn) {
      timelineCloseBtn.addEventListener('click', closeAllPopups);
    }

    // Offers close button
    const offersCloseBtn = document.getElementById('close-offers-popout');
    if (offersCloseBtn) {
      offersCloseBtn.addEventListener('click', closeAllPopups);
    }

    // Support close button
    const supportCloseBtn = document.getElementById('close-support-popout');
    if (supportCloseBtn) {
      supportCloseBtn.addEventListener('click', closeAllPopups);
    }

    // Settings close button
    const settingsCloseBtn = document.getElementById('close-settings-popout');
    if (settingsCloseBtn) {
      settingsCloseBtn.addEventListener('click', closeAllPopups);
    }
    
    // Close on overlay click
    const documentsOverlay = document.getElementById('documents-overlay');
    if (documentsOverlay) {
      documentsOverlay.addEventListener('click', closeAllPopups);
    }
    
    const calendarOverlay = document.getElementById('calendar-overlay');
    if (calendarOverlay) {
      calendarOverlay.addEventListener('click', closeAllPopups);
    }
    
    const propertyDetailsOverlay = document.getElementById('property-details-overlay');
    if (propertyDetailsOverlay) {
      propertyDetailsOverlay.addEventListener('click', closeAllPopups);
    }

    const analyticsOverlay = document.getElementById('analytics-overlay');
    if (analyticsOverlay) {
      analyticsOverlay.addEventListener('click', closeAllPopups);
    }

    const timelineOverlay = document.getElementById('timeline-overlay');
    if (timelineOverlay) {
      timelineOverlay.addEventListener('click', closeAllPopups);
    }

    const offersOverlay = document.getElementById('offers-overlay');
    if (offersOverlay) {
      offersOverlay.addEventListener('click', closeAllPopups);
    }

    const supportOverlay = document.getElementById('support-overlay');
    if (supportOverlay) {
      supportOverlay.addEventListener('click', closeAllPopups);
    }

    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', closeAllPopups);
    }
  }

  // Make functions globally accessible
  window.showPropertyDetailsPopout = showPropertyDetailsPopout;
  window.showDocumentsPopout = showDocumentsPopout;
  window.showCalendarPopout = showCalendarPopout;
  window.showAnalyticsPopout = showAnalyticsPopout;
  window.showTimelinePopout = showTimelinePopout;
  window.showOffersPopout = showOffersPopout;
  window.showSupportPopout = showSupportPopout;
  window.showSettingsPopout = showSettingsPopout;
  window.closeAllPopups = closeAllPopups;

  // Initialize when page loads
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Assistant page loaded');
    setupMenuSystem();
    setupEscapeKey();
    setupCloseButtons();
    
    // Initialize right panel toggle functionality
    if (typeof initRightPanelToggle === 'function') {
      initRightPanelToggle();
    } else {
      console.warn('initRightPanelToggle function not found');
    }
  });

  // Show Analytics Popout
  function showAnalyticsPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const analyticsPopout = document.getElementById('analytics-popout');
    const analyticsOverlay = document.getElementById('analytics-overlay');
    
    if (analyticsPopout && analyticsOverlay) {
      analyticsPopout.classList.add('active');
      analyticsOverlay.classList.add('active');
    }
  }

  // Show Timeline Popout
  function showTimelinePopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const timelinePopout = document.getElementById('timeline-popout');
    const timelineOverlay = document.getElementById('timeline-overlay');
    
    if (timelinePopout && timelineOverlay) {
      timelinePopout.classList.add('active');
      timelineOverlay.classList.add('active');
    }
  }

  // Show Offers Popout
  function showOffersPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const offersPopout = document.getElementById('offers-popout');
    const offersOverlay = document.getElementById('offers-overlay');
    
    if (offersPopout && offersOverlay) {
      offersPopout.classList.add('active');
      offersOverlay.classList.add('active');
    }
  }

  // Show Support Popout
  function showSupportPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const supportPopout = document.getElementById('support-popout');
    const supportOverlay = document.getElementById('support-overlay');
    
    if (supportPopout && supportOverlay) {
      supportPopout.classList.add('active');
      supportOverlay.classList.add('active');
    }
  }

  // Show Settings Popout
  function showSettingsPopout(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const settingsPopout = document.getElementById('settings-popout');
    const settingsOverlay = document.getElementById('settings-overlay');
    
    if (settingsPopout && settingsOverlay) {
      settingsPopout.classList.add('active');
      settingsOverlay.classList.add('active');
    }
  }

  // Email Support Functions
  function openEmailSupport() {
    const emailForm = document.getElementById('email-support-form');
    const supportOptions = document.querySelector('.support-options');
    
    if (emailForm && supportOptions) {
      supportOptions.style.display = 'none';
      emailForm.style.display = 'block';
    }
  }

  function closeEmailSupport() {
    const emailForm = document.getElementById('email-support-form');
    const supportOptions = document.querySelector('.support-options');
    
    if (emailForm && supportOptions) {
      emailForm.style.display = 'none';
      supportOptions.style.display = 'block';
    }
  }

  // Calendar Functions
  function changeMonth(delta) {
    if (typeof calendarManager !== 'undefined' && calendarManager && calendarManager.changeMonth) {
      calendarManager.changeMonth(delta);
    } else {
      console.warn('Calendar manager not available for changeMonth');
    }
  }

  function saveAvailability() {
    if (typeof calendarManager !== 'undefined' && calendarManager && calendarManager.saveAvailability) {
      calendarManager.saveAvailability();
    } else {
      console.warn('Calendar manager not available for saveAvailability');
    }
  }

  function cancelTimeSelection() {
    const availabilitySection = document.getElementById('availabilitySection');
    if (availabilitySection) {
      availabilitySection.style.display = 'none';
    }
  }

  function removeSlot(button) {
    if (button && button.parentElement) {
      button.parentElement.remove();
    }
  }

  // Document Functions
  function openDocumentSplitView(documentName, documentType) {
    console.log('Opening document split view for:', documentName, documentType);
    // This would typically open a split-screen view with the document
    // For now, we'll just log it
  }

  // Make additional functions globally accessible
  window.openEmailSupport = openEmailSupport;
  window.closeEmailSupport = closeEmailSupport;
  window.changeMonth = changeMonth;
  window.saveAvailability = saveAvailability;
  window.cancelTimeSelection = cancelTimeSelection;
  window.removeSlot = removeSlot;
  window.openDocumentSplitView = openDocumentSplitView;