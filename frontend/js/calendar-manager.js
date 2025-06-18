/**
 * Calendar Manager for Assistant Page
 * Handles the calendar popout functionality including:
 * - Calendar generation and navigation
 * - Day selection and time slot management
 * - Availability saving and syncing with schedule page
 */

class CalendarManager {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.selectedTimeSlots = [];
    this.savedAvailability = {};
    
    // Month names for display
    this.monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Day names for display
    this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Available time slots
    this.timeSlots = [
      '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
      '5:00 PM', '6:00 PM', '7:00 PM'
    ];
    
    this.initEventListeners();
    this.loadSavedAvailability();
  }
  
  // Load saved availability asynchronously
  async loadSavedAvailability() {
    try {
      this.savedAvailability = await this.getSavedAvailability();
      console.log('📅 Loaded saved availability:', this.savedAvailability);
    } catch (error) {
      console.error('❌ Error loading saved availability:', error);
      this.savedAvailability = {};
    }
  }
  
  // Initialize event listeners
  initEventListeners() {
    // Navigation buttons
    const prevBtn = document.querySelector('.calendar-popout .prev-btn');
    const nextBtn = document.querySelector('.calendar-popout .next-btn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateMonth(-1));
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateMonth(1));
    }
    
    // Availability popup buttons
    const saveBtn = document.querySelector('.calendar-popout .save-availability-btn');
    const cancelBtn = document.querySelector('.calendar-popout .close-availability');
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAvailability());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeAvailabilityPopup());
    }
    
    // Listen for availability changes from other calendars
    document.addEventListener('availabilityChanged', async (event) => {
      console.log('📅 Availability changed event received:', event.detail);
      this.savedAvailability = await this.getSavedAvailability();
      this.renderCalendar();
      await this.updateSavedAvailabilityDisplay();
    });
  }
  
  // Initialize the popout calendar
  async initPopoutCalendar() {
    this.renderCalendar();
    await this.updateSavedAvailabilityDisplay();
  }
  
  // Navigate to previous/next month
  navigateMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.renderCalendar();
  }
  
  // Alias for HTML compatibility
  changeMonth(direction) {
    return this.navigateMonth(direction);
  }
  
  // Render the calendar
  renderCalendar() {
    const calendarGrid = document.getElementById('popout-calendar-grid');
    const currentPeriod = document.querySelector('.calendar-popout .current-period');
    
    if (!calendarGrid || !currentPeriod) return;
    
    // Clean month display - just month and year
    const month = this.currentDate.getMonth();
    const year = this.currentDate.getFullYear();
    
    const monthDisplay = `${this.monthNames[month]} ${year}`;
    currentPeriod.textContent = monthDisplay;
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day outside-month';
      calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;
      
      const currentDayDate = new Date(year, month, day);
      const dateKey = this.formatDateKey(currentDayDate);
      
      // Check if this is today
      const today = new Date();
      if (currentDayDate.toDateString() === today.toDateString()) {
        dayElement.classList.add('today');
      }
      
      // Check if this date has availability
      if (this.savedAvailability[dateKey] && this.savedAvailability[dateKey].length > 0) {
        dayElement.classList.add('has-availability');
      }
      
      // Add click event
      dayElement.addEventListener('click', (event) => this.selectDay(currentDayDate, event.target));
      
      calendarGrid.appendChild(dayElement);
    }
    
    // Fill remaining cells
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDayOfWeek + daysInMonth);
    
    for (let i = 1; i <= remainingCells; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day outside-month';
      calendarGrid.appendChild(emptyDay);
    }
  }
  
  // Select a day and show time slots
  selectDay(date, clickedElement = null) {
    // Only reset selectedTimeSlots if selecting a different date
    const previousSelectedDate = this.selectedDate;
    const isDifferentDate = !previousSelectedDate || previousSelectedDate.toDateString() !== date.toDateString();
    
    this.selectedDate = date;
    
    if (isDifferentDate) {
      console.log('🗓️ Selecting different date, resetting time slots');
      this.selectedTimeSlots = [];
    } else {
      console.log('🗓️ Selecting same date, keeping existing time slots:', this.selectedTimeSlots);
    }
    
    // Remove selected class from all days
    document.querySelectorAll('.calendar-popout .calendar-day').forEach(day => {
      day.classList.remove('selected');
    });
    
    // Add selected class to clicked day
    if (clickedElement) {
      clickedElement.classList.add('selected');
    }
    
    // Enhanced date display with month context
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const displayDate = date.toLocaleDateString('en-US', options);
    
    // Add additional context for better UX
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let enhancedDisplayDate = displayDate;
    if (isToday) {
      enhancedDisplayDate += ' (Today)';
    } else if (isTomorrow) {
      enhancedDisplayDate += ' (Tomorrow)';
    }
    
    console.log('🗓️ Selected date:', enhancedDisplayDate);
    console.log('🗓️ Current selectedTimeSlots before popup:', this.selectedTimeSlots);
    
    const selectedDateElements = document.querySelectorAll('.calendar-popout .selected-date');
    selectedDateElements.forEach(el => {
      el.textContent = enhancedDisplayDate;
    });
    
    // Show availability popup
    this.showAvailabilityPopup();
    
    // Populate time slots
    this.populateTimeSlots();
  }
  
  // Show the availability popup
  showAvailabilityPopup() {
    const availabilityPopup = document.querySelector('.calendar-popout .availability-popup');
    if (availabilityPopup) {
      availabilityPopup.style.display = 'block';
    }
  }
  
  // Close the availability popup
  closeAvailabilityPopup() {
    console.log('🗓️ Closing availability popup, preserving selectedTimeSlots:', this.selectedTimeSlots);
    const availabilityPopup = document.querySelector('.calendar-popout .availability-popup');
    if (availabilityPopup) {
      availabilityPopup.style.display = 'none';
    }
    
    // Don't clear selected time slots - let user keep their selection
    // Only clear when selecting a different date or after successful save
  }
  
  // Populate time slots in the popup
  populateTimeSlots() {
    console.log('🕐 populateTimeSlots called');
    const timeSlotsContainer = document.querySelector('.calendar-popout .time-slots-container');
    if (!timeSlotsContainer) {
      console.error('❌ time-slots-container not found');
      return;
    }
    
    console.log('🕐 Found time slots container:', timeSlotsContainer);
    
    // Clear existing time slots
    timeSlotsContainer.innerHTML = '';
    
    // Get existing availability for this date
    const dateKey = this.formatDateKey(this.selectedDate);
    const existingSlots = this.savedAvailability[dateKey] || [];
    console.log('🕐 Existing slots for', dateKey, ':', existingSlots);
    
    // Create time slot elements
    console.log('🕐 Creating time slots:', this.timeSlots);
    this.timeSlots.forEach((timeSlot, index) => {
      console.log('🕐 Creating slot', index, ':', timeSlot);
      const slotElement = document.createElement('div');
      slotElement.className = 'time-slot-option';
      slotElement.textContent = timeSlot;
      
      // Check if this slot is already saved
      if (existingSlots.includes(timeSlot)) {
        slotElement.classList.add('already-saved');
        slotElement.title = 'Already available';
        console.log('🕐 Slot already saved:', timeSlot);
      }
      
      // Check if this slot is currently selected (in the selectedTimeSlots array)
      if (this.selectedTimeSlots.includes(timeSlot)) {
        slotElement.classList.add('selected');
        console.log('🕐 Restoring selected state for:', timeSlot);
      }
      
      // Add click event for selection
      console.log('🕐 Adding click listener for:', timeSlot);
      slotElement.addEventListener('click', (event) => {
        console.log('🕐 Time slot clicked!', timeSlot);
        event.preventDefault();
        event.stopPropagation();
        this.toggleTimeSlot(slotElement, timeSlot);
      });
      
      // Test that the element is clickable
      slotElement.style.cursor = 'pointer';
      slotElement.style.userSelect = 'none';
      
      timeSlotsContainer.appendChild(slotElement);
      console.log('🕐 Added slot element to container:', timeSlot);
    });
    
    console.log('🕐 All time slots created. Container children:', timeSlotsContainer.children.length);
  }
  
  // Toggle time slot selection
  toggleTimeSlot(element, timeSlot) {
    console.log('🕐 toggleTimeSlot called:', { element, timeSlot });
    console.log('🕐 Current selectedTimeSlots before toggle:', this.selectedTimeSlots);
    console.log('🕐 Selected date:', this.selectedDate);
    console.log('🕐 Element classes:', element.className);
    
    // Don't allow selection of already saved slots
    if (element.classList.contains('already-saved')) {
      console.log('🕐 Slot already saved, ignoring click');
      return;
    }
    
    if (element.classList.contains('selected')) {
      console.log('🕐 Deselecting time slot:', timeSlot);
      element.classList.remove('selected');
      this.selectedTimeSlots = this.selectedTimeSlots.filter(slot => slot !== timeSlot);
    } else {
      console.log('🕐 Selecting time slot:', timeSlot);
      element.classList.add('selected');
      
      // Make sure the array exists and is actually an array
      if (!Array.isArray(this.selectedTimeSlots)) {
        console.log('🚨 selectedTimeSlots is not an array! Creating new array.');
        this.selectedTimeSlots = [];
      }
      
      this.selectedTimeSlots.push(timeSlot);
    }
    
    console.log('🕐 Updated selectedTimeSlots after toggle:', this.selectedTimeSlots);
    console.log('🕐 Array length:', this.selectedTimeSlots.length);
    console.log('🕐 Array contents:', JSON.stringify(this.selectedTimeSlots));
    console.log('🕐 Array type check:', Array.isArray(this.selectedTimeSlots));
    
    // Verify the array is still accessible from the instance
    setTimeout(() => {
      console.log('🕐 selectedTimeSlots after 100ms:', this.selectedTimeSlots);
    }, 100);
    
    // Visual feedback
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 150);
  }
  
  // Save availability
  async saveAvailability() {
    console.log('💾 Calendar Manager: saveAvailability called');
    console.log('💾 this instance:', this);
    console.log('💾 Selected date:', this.selectedDate);
    console.log('💾 Selected time slots at start of save:', this.selectedTimeSlots);
    console.log('💾 Selected time slots length:', this.selectedTimeSlots ? this.selectedTimeSlots.length : 'undefined');
    console.log('💾 Selected time slots type:', typeof this.selectedTimeSlots);
    console.log('💾 Selected time slots JSON:', JSON.stringify(this.selectedTimeSlots));
    console.log('💾 Is array check:', Array.isArray(this.selectedTimeSlots));
    
    // Additional debug - check if we can access recent selections from DOM
    const recentSelections = document.querySelectorAll('.calendar-popout .time-slot-option.selected');
    console.log('💾 DOM shows selected slots:', recentSelections.length);
    recentSelections.forEach((slot, index) => {
      console.log(`💾 DOM selected slot ${index}:`, slot.textContent);
    });
    
    // If selectedTimeSlots is empty but DOM shows selections, reconstruct from DOM
    if ((!this.selectedTimeSlots || this.selectedTimeSlots.length === 0) && recentSelections.length > 0) {
      console.log('🔧 Reconstructing selectedTimeSlots from DOM');
      this.selectedTimeSlots = Array.from(recentSelections).map(slot => slot.textContent);
      console.log('🔧 Reconstructed array:', this.selectedTimeSlots);
    }
    
    // Enhanced validation
    if (!this.selectedDate) {
      console.error('❌ No date selected');
      alert('Please select a date first');
      return;
    }
    
    if (!this.selectedTimeSlots || !Array.isArray(this.selectedTimeSlots) || this.selectedTimeSlots.length === 0) {
      console.error('❌ No time slots selected:', this.selectedTimeSlots);
      alert('Please select at least one time slot');
      return;
    }
    
    const dateKey = this.formatDateKey(this.selectedDate);
    console.log('💾 Date key:', dateKey);
    console.log('💾 Selected date object:', this.selectedDate);
    console.log('💾 Selected date string:', this.selectedDate.toString());
    
    try {
      // Get existing availability for this date
      const existingSlots = this.savedAvailability[dateKey] || [];
      console.log('💾 Existing slots:', existingSlots);
      
      // Combine existing and new slots, removing duplicates
      const allSlots = [...new Set([...existingSlots, ...this.selectedTimeSlots])];
      console.log('💾 All slots to save:', allSlots);
      
      // Check database sync status
      console.log('💾 Database sync available:', !!window.databaseAvailabilitySync);
      console.log('💾 Database sync initialized:', window.databaseAvailabilitySync?.isInitialized);
      console.log('💾 Current user:', window.databaseAvailabilitySync?.currentUser?.email);
      console.log('💾 Current listing ID:', window.databaseAvailabilitySync?.currentListingId);
      
      let saveMethod = 'unknown';
      
      // Try database save first, but fall back gracefully
      try {
        if (window.databaseAvailabilitySync && window.databaseAvailabilitySync.isInitialized) {
          console.log('💾 Attempting database save...');
          saveMethod = 'database';
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database save timeout after 15 seconds')), 15000)
          );
          
          await Promise.race([
            window.databaseAvailabilitySync.saveAvailabilityToDatabase(this.selectedDate, allSlots),
            timeoutPromise
          ]);
          
          console.log('✅ Availability saved through database sync');
        } else {
          throw new Error('Database sync not available');
        }
      } catch (dbError) {
        console.warn('⚠️ Database save failed, trying other methods:', dbError.message);
        
        // Try addAvailability function
        if (typeof addAvailability === 'function') {
          console.log('💾 Attempting addAvailability function save...');
          saveMethod = 'function';
          try {
            await addAvailability(this.selectedDate, allSlots);
            console.log('✅ Availability saved through addAvailability function');
          } catch (funcError) {
            console.warn('⚠️ Function save failed, using localStorage:', funcError.message);
            throw funcError; // This will trigger the localStorage fallback below
          }
        } else {
          // Direct localStorage save
          console.log('💾 Using localStorage save...');
          saveMethod = 'localStorage';
          
          // Update the instance variable
          this.savedAvailability[dateKey] = allSlots;
          console.log('💾 Updated this.savedAvailability[' + dateKey + '] =', allSlots);
          console.log('💾 Full this.savedAvailability:', this.savedAvailability);
          
          // Save to localStorage
          localStorage.setItem('savedAvailability', JSON.stringify(this.savedAvailability));
          
          // Verify it was saved
          const verifyData = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
          console.log('💾 Verified localStorage data:', verifyData);
          console.log('✅ Saved to localStorage directly');
        }
      }
      
      // Update saved availability
      console.log('💾 Updating saved availability display...');
      
      // Force refresh the savedAvailability from storage
      this.savedAvailability = await this.getSavedAvailability();
      console.log('💾 Updated this.savedAvailability:', this.savedAvailability);
      
      // Close popup and refresh calendar FIRST
      this.closeAvailabilityPopup();
      this.renderCalendar();
      await this.updateSavedAvailabilityDisplay();
      
      // Clear selected time slots AFTER everything is updated
      console.log('💾 Clearing selectedTimeSlots after successful save');
      this.selectedTimeSlots = [];
      
      // Notify property listing calendars to refresh
      this.notifyPropertyCalendars();
      
      // Show success message based on save method
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const displayDate = this.selectedDate.toLocaleDateString('en-US', options);
      
      let message;
      if (saveMethod === 'database') {
        message = `✅ Availability saved to database for ${displayDate}!\n\nThis will now appear on your property listing calendar.`;
      } else if (saveMethod === 'function') {
        message = `✅ Availability saved for ${displayDate}!`;
      } else {
        message = `✅ Availability saved locally for ${displayDate}!\n\nNote: Database not connected. Data saved locally only.`;
      }
      
      console.log('✅ Save complete:', message);
      alert(message);
      
    } catch (error) {
      console.error('❌ Error saving availability:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Provide specific error messages
      let errorMessage = '❌ Error saving availability. ';
      
      if (error.message.includes('timeout')) {
        errorMessage += 'Database connection timed out. Please try again.';
      } else if (error.message.includes('authentication') || error.message.includes('User not authenticated')) {
        errorMessage += 'Please log in to save availability to database.';
      } else if (error.message.includes('listing') || error.message.includes('No listing ID')) {
        errorMessage += 'No property listing found. Please create a listing first.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += 'Please try again or contact support.';
      }
      
      errorMessage += `\n\nError details: ${error.message}`;
      
      alert(errorMessage);
      
      // Try localStorage fallback on error
      try {
        console.log('💾 Attempting localStorage fallback after error...');
        const dateKey = this.formatDateKey(this.selectedDate);
        const existingSlots = this.savedAvailability[dateKey] || [];
        const allSlots = [...new Set([...existingSlots, ...this.selectedTimeSlots])];
        
        this.savedAvailability[dateKey] = allSlots;
        localStorage.setItem('savedAvailability', JSON.stringify(this.savedAvailability));
        
        this.closeAvailabilityPopup();
        this.renderCalendar();
        await this.updateSavedAvailabilityDisplay();
        
        console.log('✅ Fallback save to localStorage successful');
        alert('⚠️ Saved locally as backup. Database save failed but your data is preserved locally.');
      } catch (fallbackError) {
        console.error('❌ Even localStorage fallback failed:', fallbackError);
      }
    }
  }
  
  // Update saved availability display
  async updateSavedAvailabilityDisplay() {
    console.log('🔄 Updating saved availability display...');
    const savedSlotsContainer = document.getElementById('saved-slots');
    if (!savedSlotsContainer) {
      console.error('❌ saved-slots container not found');
      return;
    }
    
    // Clear existing display
    savedSlotsContainer.innerHTML = '';
    
    // Get saved availability (await the async call)
    const savedAvailability = await this.getSavedAvailability();
    console.log('📅 Current saved availability:', savedAvailability);
    
    if (Object.keys(savedAvailability).length === 0) {
      const noAvailability = document.createElement('li');
      noAvailability.textContent = 'No availability set yet';
      noAvailability.style.color = '#666';
      noAvailability.style.fontStyle = 'italic';
      savedSlotsContainer.appendChild(noAvailability);
      console.log('📅 No availability to display');
      return;
    }
    
    // Sort dates
    const sortedDates = Object.keys(savedAvailability).sort((a, b) => {
      const dateA = this.parseDateKey(a);
      const dateB = this.parseDateKey(b);
      return dateA - dateB;
    });
    
    // Display each date with its time slots
    sortedDates.forEach(dateKey => {
      console.log('📅 Processing date key:', dateKey);
      const date = this.parseDateKey(dateKey);
      const timeSlots = savedAvailability[dateKey];
      console.log('📅 Date:', date, 'Time slots:', timeSlots);
      
      if (timeSlots && timeSlots.length > 0) {
        const dateItem = document.createElement('li');
        dateItem.className = 'saved-availability-item';
        
        // Enhanced date display with full month and year context
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        const displayDate = date.toLocaleDateString('en-US', options);
        
        // Add relative date context
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
        
        let contextLabel = '';
        if (isToday) {
          contextLabel = ' <span class="date-context today">Today</span>';
        } else if (isTomorrow) {
          contextLabel = ' <span class="date-context tomorrow">Tomorrow</span>';
        }
        
        dateItem.innerHTML = `
          <div class="saved-date">
            <div class="date-info">
              <strong>${displayDate}${contextLabel}</strong>
              <span class="slot-count">(${timeSlots.length} time slot${timeSlots.length !== 1 ? 's' : ''})</span>
            </div>
            <button class="remove-date-btn" data-date-key="${dateKey}" title="Remove all availability for this date">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="saved-times">
            ${timeSlots.map(slot => `
              <span class="time-chip">
                <span class="time-text">${slot}</span>
                <button class="remove-time-btn" data-date-key="${dateKey}" data-time-slot="${slot}" title="Remove this time slot">
                  <i class="fas fa-times"></i>
                </button>
              </span>
            `).join('')}
          </div>
        `;
        
        savedSlotsContainer.appendChild(dateItem);
      }
    });
    
    // Add event listeners for remove buttons
    this.setupRemoveButtons();
  }
  
  // Setup remove buttons for saved availability
  setupRemoveButtons() {
    // Remove entire date
    document.querySelectorAll('.remove-date-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateKey = btn.dataset.dateKey;
        this.removeAvailabilityDate(dateKey);
      });
    });
    
    // Remove individual time slot
    document.querySelectorAll('.remove-time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateKey = btn.dataset.dateKey;
        const timeSlot = btn.dataset.timeSlot;
        this.removeAvailabilitySlot(dateKey, timeSlot);
      });
    });
  }
  
  // Remove all availability for a date
  async removeAvailabilityDate(dateKey) {
    console.log('🗑️ Removing entire date:', dateKey);
    
    // Parse date for better user experience
    const date = this.parseDateKey(dateKey);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const displayDate = date.toLocaleDateString('en-US', options);
    
    if (confirm(`Remove all availability for ${displayDate}?`)) {
      try {
        // Direct localStorage approach to avoid function conflicts
        const currentData = localStorage.getItem('savedAvailability');
        const savedAvailability = currentData ? JSON.parse(currentData) : {};
        
        console.log('🗑️ Current availability before date removal:', savedAvailability);
        
        if (savedAvailability[dateKey]) {
          delete savedAvailability[dateKey];
          console.log('🗑️ Removed entire date');
          
          // Save back to localStorage
          localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
          console.log('🗑️ Updated availability saved:', savedAvailability);
          
          // Update internal state
          this.savedAvailability = savedAvailability;
          
          // Refresh UI
          this.renderCalendar();
          await this.updateSavedAvailabilityDisplay();
          
          // Notify property calendars of the change
          this.notifyPropertyCalendars();
          
          console.log('✅ Date removed successfully');
          alert(`✅ All availability removed for ${displayDate}`);
        } else {
          console.warn('⚠️ Date key not found in saved availability:', dateKey);
          alert('⚠️ No availability found for this date');
        }
      } catch (error) {
        console.error('❌ Error removing availability date:', error);
        alert('❌ Error removing availability. Please try again.');
      }
    }
  }
  
  // Remove a specific time slot
  async removeAvailabilitySlot(dateKey, timeSlot) {
    console.log('🗑️ Removing time slot:', { dateKey, timeSlot });
    
    try {
      // Direct localStorage approach to avoid function conflicts
      const currentData = localStorage.getItem('savedAvailability');
      const savedAvailability = currentData ? JSON.parse(currentData) : {};
      
      console.log('🗑️ Current availability before removal:', savedAvailability);
      
      if (savedAvailability[dateKey]) {
        // Remove the specific time slot
        const originalLength = savedAvailability[dateKey].length;
        savedAvailability[dateKey] = savedAvailability[dateKey].filter(slot => slot !== timeSlot);
        console.log('🗑️ Filtered time slots:', savedAvailability[dateKey]);
        
        // Check if time slot was actually removed
        if (savedAvailability[dateKey].length === originalLength) {
          console.warn('⚠️ Time slot not found:', timeSlot);
          alert(`⚠️ Time slot "${timeSlot}" not found`);
          return;
        }
        
        // If no time slots left for this date, remove the entire date
        if (savedAvailability[dateKey].length === 0) {
          delete savedAvailability[dateKey];
          console.log('🗑️ Removed entire date (no slots left)');
        }
        
        // Save back to localStorage
        localStorage.setItem('savedAvailability', JSON.stringify(savedAvailability));
        console.log('🗑️ Updated availability saved:', savedAvailability);
        
        // Update internal state
        this.savedAvailability = savedAvailability;
        
        // Refresh UI
        this.renderCalendar();
        await this.updateSavedAvailabilityDisplay();
        
        // Notify property calendars of the change
        this.notifyPropertyCalendars();
        
        console.log('✅ Time slot removed successfully');
        
        // Show success message
        const date = this.parseDateKey(dateKey);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const displayDate = date.toLocaleDateString('en-US', options);
        
        if (savedAvailability[dateKey]) {
          alert(`✅ Removed "${timeSlot}" from ${displayDate}`);
        } else {
          alert(`✅ Removed "${timeSlot}" from ${displayDate}. All time slots removed for this date.`);
        }
      } else {
        console.warn('⚠️ Date key not found in saved availability:', dateKey);
        alert('⚠️ No availability found for this date');
      }
    } catch (error) {
      console.error('❌ Error removing availability slot:', error);
      alert('❌ Error removing availability. Please try again.');
    }
  }
  
  // Get saved availability from database or localStorage
  async getSavedAvailability() {
    console.log('📅 getSavedAvailability called');
    
    // If user is not authenticated, prioritize localStorage
    const isAuthenticated = window.databaseAvailabilitySync?.currentUser;
    const hasListingId = window.databaseAvailabilitySync?.currentListingId;
    
    if (!isAuthenticated || !hasListingId) {
      console.log('📅 User not authenticated or no listing ID - using localStorage');
      const localData = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
      console.log('📅 localStorage data:', localData);
      return localData;
    }
    
    try {
      // Try database first only if authenticated and has listing
      if (window.databaseAvailabilitySync && window.databaseAvailabilitySync.isInitialized) {
        console.log('📅 Loading availability from database');
        const dbData = await window.databaseAvailabilitySync.loadAvailabilityFromDatabase();
        console.log('📅 Database returned:', dbData);
        return dbData;
      } else if (typeof window.getSavedAvailability === 'function') {
        console.log('📅 Using global getSavedAvailability function');
        const globalData = await window.getSavedAvailability();
        console.log('📅 Global function returned:', globalData);
        return globalData;
    } else {
      // Fallback to direct localStorage access
        console.log('📅 Reading directly from localStorage');
        const localData = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
        console.log('📅 localStorage data:', localData);
        return localData;
      }
    } catch (error) {
      console.error('❌ Error getting saved availability:', error);
      // Fallback to localStorage
      console.log('📅 Error fallback: reading from localStorage');
      const fallbackData = JSON.parse(localStorage.getItem('savedAvailability') || '{}');
      console.log('📅 Fallback data:', fallbackData);
      return fallbackData;
    }
  }
  
  // Format date as key (YYYY-M-D)
  formatDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
  
  // Parse date key back to Date object
  parseDateKey(dateKey) {
    const parts = dateKey.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  
  // Notify property listing calendars to refresh
  notifyPropertyCalendars() {
    console.log('📢 Notifying property calendars to refresh...');
    
    // Send custom event that property calendars can listen for
    const refreshEvent = new CustomEvent('propertyCalendarRefresh', {
      detail: {
        source: 'assistant-calendar',
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(refreshEvent);
    
    // Also try to directly refresh if property calendar exists
    if (window.propertyCalendar && typeof window.propertyCalendar.refreshCalendar === 'function') {
      console.log('📅 Directly refreshing property calendar');
      window.propertyCalendar.refreshCalendar();
    }
  }
}

// Create global calendar manager instance when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🗓️ Initializing Calendar Manager');
  
  // Create global calendar manager instance
  const calendarManager = new CalendarManager();
  
  // Make it globally accessible
  window.calendarManager = calendarManager;
  
  console.log('✅ Calendar Manager initialized');
  
  // Debug: Add test methods to verify functionality
  window.testCalendarManager = function() {
    console.log('🧪 Testing Calendar Manager functionality...');
    console.log('🧪 Calendar Manager instance:', calendarManager);
    console.log('🧪 Selected date:', calendarManager.selectedDate);
    console.log('🧪 Selected time slots:', calendarManager.selectedTimeSlots);
    console.log('🧪 Saved availability:', calendarManager.savedAvailability);
    
    // Test date selection
    const testDate = new Date();
    console.log('🧪 Testing selectDay with today:', testDate);
    calendarManager.selectDay(testDate);
    
    console.log('🧪 After selectDay - Selected date:', calendarManager.selectedDate);
    console.log('🧪 After selectDay - Selected time slots:', calendarManager.selectedTimeSlots);
  };
  
  // Debug: Add method to test time slot selection
  window.testTimeSlotSelection = function() {
    console.log('🧪 Testing time slot selection...');
    
    // First select a date
    const testDate = new Date();
    calendarManager.selectDay(testDate);
    
    // Simulate time slot selection
    const testTimeSlot = '10:00 AM';
    console.log('🧪 Before selecting time slot:', calendarManager.selectedTimeSlots);
    
    // Create a mock element for testing
    const mockElement = {
      classList: {
        contains: () => false,
        add: () => console.log('🧪 Adding selected class'),
        remove: () => console.log('🧪 Removing selected class'),
        toggle: () => console.log('🧪 Toggling selected class')
      },
      style: {}
    };
    
    calendarManager.toggleTimeSlot(mockElement, testTimeSlot);
    
    console.log('🧪 After selecting time slot:', calendarManager.selectedTimeSlots);
    console.log('🧪 Time slot array length:', calendarManager.selectedTimeSlots.length);
    
    // Test save functionality
    console.log('🧪 Testing save functionality...');
    calendarManager.saveAvailability();
  };
}); 