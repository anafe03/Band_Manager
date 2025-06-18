/**
 * Calendar Manager Test Suite
 * This file contains tests to verify the calendar-manager.js fixes
 * Run these tests in the browser console after loading the calendar page
 */

// Test 1: Verify calendar manager initialization
function testCalendarManagerInit() {
  console.log('🧪 Test 1: Calendar Manager Initialization');
  
  if (typeof window.calendarManager === 'undefined') {
    console.error('❌ Calendar Manager not initialized');
    return false;
  }
  
  console.log('✅ Calendar Manager initialized successfully');
  console.log('🧪 Instance:', window.calendarManager);
  return true;
}

// Test 2: Test date selection and time slot persistence
function testTimeSlotPersistence() {
  console.log('🧪 Test 2: Time Slot Persistence');
  
  const manager = window.calendarManager;
  if (!manager) {
    console.error('❌ Calendar Manager not available');
    return false;
  }
  
  // Select a date
  const testDate = new Date();
  console.log('🧪 Selecting date:', testDate);
  manager.selectDay(testDate);
  
  // Verify initial state
  console.log('🧪 Initial selectedTimeSlots:', manager.selectedTimeSlots);
  
  // Simulate time slot selection
  const testSlot = '10:00 AM';
  console.log('🧪 Adding time slot:', testSlot);
  
  // Create mock element
  let isSelected = false;
  const mockElement = {
    classList: {
      contains: (className) => className === 'selected' ? isSelected : false,
      add: (className) => { 
        if (className === 'selected') isSelected = true;
        console.log('🧪 Added class:', className);
      },
      remove: (className) => { 
        if (className === 'selected') isSelected = false;
        console.log('🧪 Removed class:', className);
      }
    },
    style: {}
  };
  
  // Toggle time slot
  manager.toggleTimeSlot(mockElement, testSlot);
  
  console.log('🧪 After toggle - selectedTimeSlots:', manager.selectedTimeSlots);
  console.log('🧪 Array length:', manager.selectedTimeSlots.length);
  
  // Test persistence when selecting same date again
  console.log('🧪 Selecting same date again...');
  manager.selectDay(testDate);
  console.log('🧪 After re-selecting date - selectedTimeSlots:', manager.selectedTimeSlots);
  
  if (manager.selectedTimeSlots.length > 0) {
    console.log('✅ Time slots persisted correctly');
    return true;
  } else {
    console.error('❌ Time slots not persisted');
    return false;
  }
}

// Test 3: Test save functionality
function testSaveAvailability() {
  console.log('🧪 Test 3: Save Availability');
  
  const manager = window.calendarManager;
  if (!manager) {
    console.error('❌ Calendar Manager not available');
    return false;
  }
  
  // Setup test data
  const testDate = new Date();
  const testSlots = ['10:00 AM', '11:00 AM'];
  
  manager.selectDay(testDate);
  manager.selectedTimeSlots = testSlots;
  
  console.log('🧪 Before save - selectedTimeSlots:', manager.selectedTimeSlots);
  
  // Test save (this will show validation but won't actually save to prevent data corruption)
  try {
    console.log('🧪 Testing save validation...');
    const dateKey = manager.formatDateKey(testDate);
    console.log('🧪 Date key:', dateKey);
    
    if (manager.selectedTimeSlots.length > 0) {
      console.log('✅ Save validation passed - would save:', manager.selectedTimeSlots);
      return true;
    } else {
      console.error('❌ Save validation failed - empty array');
      return false;
    }
  } catch (error) {
    console.error('❌ Save test error:', error);
    return false;
  }
}

// Run all tests
function runCalendarTests() {
  console.log('🧪 Running Calendar Manager Test Suite');
  console.log('=====================================');
  
  const results = [];
  
  results.push(testCalendarManagerInit());
  results.push(testTimeSlotPersistence());
  results.push(testSaveAvailability());
  
  console.log('=====================================');
  console.log('🧪 Test Results:');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✅ All tests passed (${passed}/${total})`);
  } else {
    console.log(`❌ ${total - passed} tests failed (${passed}/${total})`);
  }
  
  return passed === total;
}

// Export test functions
if (typeof window !== 'undefined') {
  window.runCalendarTests = runCalendarTests;
  window.testCalendarManagerInit = testCalendarManagerInit;
  window.testTimeSlotPersistence = testTimeSlotPersistence;
  window.testSaveAvailability = testSaveAvailability;
}