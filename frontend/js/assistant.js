// DOM Elements
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
let calendarSidebar = null;
let documentsSidebar = null;
let currentThreadId = null;

// Hard-code the origin of your FastAPI
const API_BASE_URL = "https://vesty-app-fastapi.onrender.com";



// API Configuration
//const API_BASE_URL = window.location.origin;

// Initialize chat interface
document.addEventListener('DOMContentLoaded', function() {
    // Focus on input when page loads
    chatInput.focus();
    
    // Add event listener for Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initialize menu item click handlers
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Check if this is the Calendar menu item
            if (this.querySelector('span').textContent === 'Calendar') {
                toggleCalendarSidebar();
                // Hide documents sidebar if open
                if (documentsSidebar && documentsSidebar.style.display !== 'none') {
                    documentsSidebar.style.display = 'none';
                }
            } 
            // Check if this is the Documents menu item
            else if (this.querySelector('span').textContent === 'Documents') {
                toggleDocumentsSidebar();
                // Hide calendar if open
                if (calendarSidebar && calendarSidebar.style.display !== 'none') {
                    calendarSidebar.style.display = 'none';
                }
            } else {
                // Hide both sidebars if another menu item is clicked
                if (calendarSidebar && calendarSidebar.style.display !== 'none') {
                    calendarSidebar.style.display = 'none';
                }
                if (documentsSidebar && documentsSidebar.style.display !== 'none') {
                    documentsSidebar.style.display = 'none';
                }
            }
        });
    });
    
    // Create the calendar sidebar structure
    createCalendarSidebar();
    
    // Create the documents sidebar structure
    createDocumentsSidebar();

    // Load existing conversation if thread ID exists
    loadExistingConversation();
    
    // Initialize right panel toggle
    initRightPanelToggle();
});

// API Functions
async function createThread() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/langgraph/thread`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create thread: ${response.statusText}`);
        }
        
        const data = await response.json();
        currentThreadId = data.thread_id;
        localStorage.setItem('vesty_thread_id', currentThreadId);
        return data;
    } catch (error) {
        console.error('Error creating thread:', error);
        throw error;
    }
}

async function sendMessageToAPI(message, threadId = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/langgraph/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                thread_id: threadId
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

async function loadExistingConversation() {
    const savedThreadId = localStorage.getItem('vesty_thread_id');
    if (savedThreadId) {
        try {
            // Check if thread still exists
            const response = await fetch(`${API_BASE_URL}/api/langgraph/thread/${savedThreadId}/exists`);
            const data = await response.json();
            
            if (data.exists) {
                currentThreadId = savedThreadId;
                // Load conversation history
                await loadConversationHistory(savedThreadId);
            } else {
                // Thread doesn't exist, clear saved ID
                localStorage.removeItem('vesty_thread_id');
            }
        } catch (error) {
            console.error('Error checking thread:', error);
            localStorage.removeItem('vesty_thread_id');
        }
    }
}

async function loadConversationHistory(threadId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/langgraph/history?thread_id=${threadId}`);
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
            // Clear existing messages except welcome message
            const welcomeMessage = chatBox.querySelector('.message.assistant-message');
            chatBox.innerHTML = '';
            if (welcomeMessage) {
                chatBox.appendChild(welcomeMessage);
            }
            
            // Add historical messages
            data.messages.forEach(msg => {
                if (msg.role === 'user') {
                    addUserMessage(msg.content, false);
                } else if (msg.role === 'assistant') {
                    addAssistantMessage(msg.content, false);
                }
            });
            
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error loading conversation history:', error);
    }
}

// Send user message
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message to chat immediately
    addUserMessage(text);
    
    // Clear input field
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Create thread if it doesn't exist
        if (!currentThreadId) {
            await createThread();
        }
        
        // Send message to API
        const response = await sendMessageToAPI(text, currentThreadId);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add assistant response
        if (response.response) {
            addAssistantMessage(response.response);
        } else {
            addAssistantMessage("I'm sorry, I couldn't process your message. Please try again.");
        }
        
        // Update thread ID if it changed
        if (response.thread_id && response.thread_id !== currentThreadId) {
            currentThreadId = response.thread_id;
            localStorage.setItem('vesty_thread_id', currentThreadId);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        addAssistantMessage("I'm experiencing some technical difficulties. Please try again later.");
    }
}

// Add user message to chat
function addUserMessage(text, scroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    contentDiv.appendChild(paragraph);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    chatBox.appendChild(messageDiv);
    
    if (scroll) {
        scrollToBottom();
    }
}

// Add assistant message to chat
function addAssistantMessage(text, scroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const avatarIcon = document.createElement('span');
    avatarIcon.className = 'avatar-icon';
    avatarIcon.textContent = 'V';
    avatarDiv.appendChild(avatarIcon);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    contentDiv.appendChild(paragraph);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    chatBox.appendChild(messageDiv);
    
    if (scroll) {
        scrollToBottom();
    }
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const avatarIcon = document.createElement('span');
    avatarIcon.className = 'avatar-icon';
    avatarIcon.textContent = 'V';
    avatarDiv.appendChild(avatarIcon);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dotsDiv.appendChild(dot);
    }
    
    contentDiv.appendChild(dotsDiv);
    
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    
    chatBox.appendChild(typingDiv);
    
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Use suggestion button
function usesuggestion(button) {
    const text = button.textContent;
    chatInput.value = text;
    sendMessage();
}

// Get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${hours}:${minutes} ${ampm}`;
}

// Scroll chat to bottom
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Calendar Functionality
function createCalendarSidebar() {
    if (!calendarSidebar) {
        calendarSidebar = document.createElement('div');
        calendarSidebar.className = 'calendar-sidebar';
        calendarSidebar.style.display = 'none';
        document.querySelector('.sidebar').appendChild(calendarSidebar);
        
        const calendarHeader = document.createElement('div');
        calendarHeader.className = 'calendar-header';
        calendarSidebar.appendChild(calendarHeader);
        
        const calendarTitle = document.createElement('h3');
        calendarTitle.textContent = 'My Availability';
        calendarHeader.appendChild(calendarTitle);
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'calendar-close-btn';
        closeBtn.addEventListener('click', () => {
            calendarSidebar.style.display = 'none';
        });
        calendarHeader.appendChild(closeBtn);
        
        const navControls = document.createElement('div');
        navControls.className = 'calendar-nav';
        
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&laquo;';
        prevBtn.className = 'calendar-nav-btn';
        prevBtn.addEventListener('click', () => {
            changeMonth(-1);
        });
        
        const monthYearDisplay = document.createElement('div');
        monthYearDisplay.className = 'calendar-month-year';
        monthYearDisplay.id = 'calendarMonthYear';
        
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&raquo;';
        nextBtn.className = 'calendar-nav-btn';
        nextBtn.addEventListener('click', () => {
            changeMonth(1);
        });
        
        navControls.appendChild(prevBtn);
        navControls.appendChild(monthYearDisplay);
        navControls.appendChild(nextBtn);
        calendarSidebar.appendChild(navControls);
        
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        calendarGrid.id = 'calendarGrid';
        calendarSidebar.appendChild(calendarGrid);
        
        const availabilitySection = document.createElement('div');
        availabilitySection.className = 'availability-section';
        availabilitySection.style.display = 'none';
        availabilitySection.id = 'availabilitySection';
        
        const selectedDateDisplay = document.createElement('div');
        selectedDateDisplay.className = 'selected-date';
        selectedDateDisplay.id = 'selectedDate';
        availabilitySection.appendChild(selectedDateDisplay);
        
        const timeInputLabel = document.createElement('label');
        timeInputLabel.textContent = 'Available times:';
        timeInputLabel.for = 'availabilityInput';
        availabilitySection.appendChild(timeInputLabel);
        
        const timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.id = 'availabilityInput';
        timeInput.placeholder = 'e.g., 9:00 AM - 12:00 PM';
        availabilitySection.appendChild(timeInput);
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-availability-btn';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', saveAvailability);
        availabilitySection.appendChild(saveBtn);
        
        calendarSidebar.appendChild(availabilitySection);
    }
}

function toggleCalendarSidebar() {
    if (!calendarSidebar) return;
    
    if (calendarSidebar.style.display === 'none' || calendarSidebar.style.display === '') {
        calendarSidebar.style.display = 'block';
        const today = new Date();
        renderCalendar(today);
    } else {
        calendarSidebar.style.display = 'none';
    }
}

function toggleDocumentsSidebar() {
    const documentsPopup = document.getElementById('documents-popup');
    if (!documentsPopup) return;
    
    documentsSidebar = documentsPopup;
    
    if (documentsPopup.style.display === 'none' || documentsPopup.style.display === '') {
        documentsPopup.style.display = 'block';
        documentsPopup.classList.add('active');
        setupDocumentEventListeners(documentsPopup);
    } else {
        documentsPopup.style.display = 'none';
        documentsPopup.classList.remove('active');
    }
}

function setupDocumentEventListeners(documentsPopup) {
    if (documentsPopup.hasAttribute('data-initialized')) return;
    documentsPopup.setAttribute('data-initialized', 'true');
    
    const closeBtn = documentsPopup.querySelector('.documents-sidebar-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            documentsPopup.style.display = 'none';
            documentsPopup.classList.remove('active');
            
            const documentsMenuItem = document.getElementById('documents-menu-item');
            if (documentsMenuItem) {
                documentsMenuItem.classList.remove('active');
                const chatMenuItem = document.querySelector('.menu-item:first-child');
                if (chatMenuItem) {
                    chatMenuItem.classList.add('active');
                }
            }
        });
    }
    
    const documentItems = documentsPopup.querySelectorAll('.sidebar-document-item');
    documentItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const documentName = this.querySelector('span').textContent;
            addAssistantMessage(`I've opened "${documentName}" for you. You can view and edit it here.`);
            documentsPopup.style.display = 'none';
            documentsPopup.classList.remove('active');
            
            const documentsMenuItem = document.getElementById('documents-menu-item');
            if (documentsMenuItem) {
                documentsMenuItem.classList.remove('active');
                const chatMenuItem = document.querySelector('.menu-item:first-child');
                if (chatMenuItem) {
                    chatMenuItem.classList.add('active');
                }
            }
        });
    });
    
    const uploadBtn = documentsPopup.querySelector('.document-action-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            addAssistantMessage("I've opened the document upload dialog for you. You can select a file to upload.");
        });
    }
}

function createDocumentsSidebar() {
    documentsSidebar = document.getElementById('documents-popup');
    if (!documentsSidebar) return;
    
    setupDocumentEventListeners(documentsSidebar);
}

// Calendar variables and functions
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const userAvailability = {};

function renderCalendar(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = i;
        
        const dateKey = `${year}-${month+1}-${i}`;
        if (userAvailability[dateKey]) {
            dayCell.classList.add('available');
            dayCell.title = userAvailability[dateKey];
        }
        
        dayCell.addEventListener('click', () => selectDay(i, month, year));
        calendarGrid.appendChild(dayCell);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    renderCalendar(new Date(currentYear, currentMonth, 1));
}

function selectDay(day, month, year) {
    const availabilitySection = document.getElementById('availabilitySection');
    availabilitySection.style.display = 'block';
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('selectedDate').textContent = `${monthNames[month]} ${day}, ${year}`;
    
    availabilitySection.dataset.day = day;
    availabilitySection.dataset.month = month;
    availabilitySection.dataset.year = year;
    
    const dateKey = `${year}-${month+1}-${day}`;
    const availabilityInput = document.getElementById('availabilityInput');
    
    const existingTimesContainer = document.getElementById('existingTimes') || createExistingTimesContainer();
    existingTimesContainer.innerHTML = '';
    
    if (userAvailability[dateKey]) {
        availabilityInput.value = '';
        
        const availableTimes = userAvailability[dateKey].split(',').map(time => time.trim());
        
        const timesHeading = document.createElement('h4');
        timesHeading.textContent = 'Available Times:';
        timesHeading.className = 'times-heading';
        existingTimesContainer.appendChild(timesHeading);
        
        const timeChipsContainer = document.createElement('div');
        timeChipsContainer.className = 'time-chips-container';
        existingTimesContainer.appendChild(timeChipsContainer);
        
        availableTimes.forEach(time => {
            if (!time) return;
            
            const timeChip = document.createElement('div');
            timeChip.className = 'time-chip';
            
            const timeText = document.createElement('span');
            timeText.textContent = time;
            timeChip.appendChild(timeText);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'time-delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remove this time';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const updatedTimes = availableTimes.filter(t => t !== time);
                
                if (updatedTimes.length > 0) {
                    userAvailability[dateKey] = updatedTimes.join(', ');
                } else {
                    delete userAvailability[dateKey];
                }
                
                timeChip.remove();
                
                if (updatedTimes.length === 0) {
                    timesHeading.remove();
                    timeChipsContainer.remove();
                }
                
                renderCalendar(new Date(year, month, 1));
            });
            
            timeChip.appendChild(deleteBtn);
            timeChipsContainer.appendChild(timeChip);
        });
    } else {
        availabilityInput.value = '';
        
        const noTimesMessage = document.createElement('p');
        noTimesMessage.textContent = 'No availability times set for this day. Add times below.';
        noTimesMessage.className = 'no-times-message';
        existingTimesContainer.appendChild(noTimesMessage);
    }
    
    availabilityInput.focus();
}

function createExistingTimesContainer() {
    const availabilitySection = document.getElementById('availabilitySection');
    const container = document.createElement('div');
    container.id = 'existingTimes';
    container.className = 'existing-times';
    
    const inputContainer = document.querySelector('.availability-input');
    availabilitySection.insertBefore(container, inputContainer);
    
    return container;
}

function saveAvailability() {
    const availabilitySection = document.getElementById('availabilitySection');
    const day = parseInt(availabilitySection.dataset.day);
    const month = parseInt(availabilitySection.dataset.month);
    const year = parseInt(availabilitySection.dataset.year);
    
    const availabilityInput = document.getElementById('availabilityInput');
    const newTimeSlot = availabilityInput.value.trim();
    
    const dateKey = `${year}-${month+1}-${day}`;
    
    if (newTimeSlot) {
        if (userAvailability[dateKey]) {
            const existingTimes = userAvailability[dateKey].split(',').map(time => time.trim());
            
            if (!existingTimes.includes(newTimeSlot)) {
                existingTimes.push(newTimeSlot);
                userAvailability[dateKey] = existingTimes.join(', ');
            }
        } else {
            userAvailability[dateKey] = newTimeSlot;
        }
        
        availabilityInput.value = '';
        selectDay(day, month, year);
    }
    
    renderCalendar(new Date(year, month, 1));
    availabilitySection.style.display = 'none';
}

// Initialize right panel toggle functionality
function initRightPanelToggle() {
    console.log('Initializing right panel toggle...');
    
    const rightPanel = document.getElementById('right-panel');
    const toggleButton = document.getElementById('right-panel-toggle');
    const appContainer = document.querySelector('.app-container');
    
    console.log('Elements found:', {
        rightPanel: !!rightPanel,
        toggleButton: !!toggleButton,
        appContainer: !!appContainer
    });
    
    if (!rightPanel || !toggleButton || !appContainer) {
        console.warn('Right panel toggle elements not found:', {
            rightPanel: !!rightPanel,
            toggleButton: !!toggleButton,
            appContainer: !!appContainer
        });
        return;
    }
    
    let isCollapsed = false;
    
    // Check if we're on mobile
    function isMobile() {
        return window.innerWidth <= 992;
    }
    
    // Initialize panel state based on screen size
    function initializePanelState() {
        if (isMobile()) {
            // On mobile, start with panel collapsed
            isCollapsed = true;
            rightPanel.classList.add('collapsed');
            appContainer.classList.add('right-panel-collapsed');
            toggleButton.setAttribute('title', 'Show sidebar');
        } else {
            // On desktop, start with panel expanded
            isCollapsed = false;
            rightPanel.classList.remove('collapsed');
            appContainer.classList.remove('right-panel-collapsed');
            toggleButton.setAttribute('title', 'Hide sidebar');
        }
        console.log('Panel state initialized:', { isCollapsed, isMobile: isMobile() });
    }
    
    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isCollapsed = !isCollapsed;
        console.log('Toggle clicked, new state:', isCollapsed ? 'collapsed' : 'expanded');
        
        if (isCollapsed) {
            // Collapse the right panel
            rightPanel.classList.add('collapsed');
            appContainer.classList.add('right-panel-collapsed');
            toggleButton.setAttribute('title', 'Show sidebar');
            
            // Remove mobile overlay if present
            if (isMobile()) {
                appContainer.classList.remove('right-panel-open');
            }
            
            // Enhance chat area
            setTimeout(() => {
                const chatContainer = document.querySelector('.minimal-chat-container');
                if (chatContainer) {
                    chatContainer.style.transition = 'width 0.3s ease';
                    chatContainer.style.width = '100%';
                }
            }, 100);
        } else {
            // Expand the right panel
            rightPanel.classList.remove('collapsed');
            appContainer.classList.remove('right-panel-collapsed');
            toggleButton.setAttribute('title', 'Hide sidebar');
            
            // Add mobile overlay if on mobile
            if (isMobile()) {
                appContainer.classList.add('right-panel-open');
            }
            
            // Reset chat area
            setTimeout(() => {
                const chatContainer = document.querySelector('.minimal-chat-container');
                if (chatContainer) {
                    chatContainer.style.width = '';
                }
            }, 100);
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        // Reinitialize panel state when switching between mobile and desktop
        initializePanelState();
    });
    
    // Close panel when clicking overlay on mobile
    appContainer.addEventListener('click', function(e) {
        if (isMobile() && !isCollapsed && !rightPanel.contains(e.target) && e.target !== toggleButton) {
            toggleButton.click();
        }
    });
    
    // Add keyboard shortcut (Ctrl/Cmd + ]) to toggle right panel
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === ']') {
            e.preventDefault();
            toggleButton.click();
        }
    });
    
    // Make sure toggle button is visible and properly styled
    console.log('Applying styles to toggle button...');
    toggleButton.style.display = 'flex';
    toggleButton.style.visibility = 'visible';
    toggleButton.style.position = 'absolute';
    toggleButton.style.left = '-45px';
    toggleButton.style.top = '50%';
    toggleButton.style.transform = 'translateY(-50%)';
    toggleButton.style.zIndex = '9999';
    toggleButton.style.backgroundColor = 'rgba(51, 68, 60, 0.95)';
    toggleButton.style.border = '2px solid rgba(255, 255, 255, 0.2)';
    toggleButton.style.borderRadius = '8px 0 0 8px';
    toggleButton.style.width = '45px';
    toggleButton.style.height = '85px';
    toggleButton.style.color = '#ffffff';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.justifyContent = 'center';
    toggleButton.style.opacity = '1';
    toggleButton.style.pointerEvents = 'auto';
    
    // Initialize panel state
    initializePanelState();
    
    console.log('Right panel toggle initialized successfully');
    console.log('Toggle button element:', toggleButton);
    console.log('Toggle button computed styles:', window.getComputedStyle(toggleButton));
    
    // Force a repaint
    setTimeout(() => {
        toggleButton.style.display = 'none';
        toggleButton.offsetHeight; // Trigger reflow
        toggleButton.style.display = 'flex';
        console.log('Toggle button forced repaint completed');
    }, 100);
}