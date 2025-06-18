// Script to update all "Get Started" buttons to link to signup page
document.addEventListener('DOMContentLoaded', function() {
    // First approach: Handle buttons that need to be wrapped in links
    document.querySelectorAll('button.cta-button').forEach(button => {
      if (button.textContent.trim() === 'Get Started') {
        // Skip if button is already inside an <a> tag
        if (button.parentElement.tagName === 'A') return;
        
        // Determine which link to use based on context
        let linkHref = 'signup.html';
        
        // Check if it's in a pricing card
        const priceCard = button.closest('.price-card');
        if (priceCard) {
          const isPremium = priceCard.classList.contains('featured');
          linkHref = isPremium ? 'signup.html?plan=premium' : 'signup.html?plan=standard';
        }
        
        // Create a new link element
        const link = document.createElement('a');
        link.href = linkHref;
        link.className = button.className; // Copy all classes
        link.innerHTML = button.innerHTML; // Copy inner content
        
        // Replace the button with the link
        button.parentNode.replaceChild(link, button);
      }
    });
    
    // Second approach: Add click handlers to all buttons as a fallback
    document.addEventListener('click', function(event) {
      const target = event.target;
      
      // Check if it's a button or inside a button with the right text
      const button = target.closest('button.cta-button');
      if (button && button.textContent.trim() === 'Get Started') {
        event.preventDefault();
        
        // Determine which link to use
        let linkHref = 'signup.html';
        
        // Check if it's in a pricing card
        const priceCard = button.closest('.price-card');
        if (priceCard) {
          const isPremium = priceCard.classList.contains('featured');
          linkHref = isPremium ? 'signup.html?plan=premium' : 'signup.html?plan=standard';
        }
        
        // Navigate to the signup page
        window.location.href = linkHref;
      }
    });
    
    // Log for debugging
    console.log('Signup links script loaded and executed');
  });
  // Handle signup form submission (add this to your existing signup.js)
  document.addEventListener('DOMContentLoaded', function() {
    // Your existing "Get Started" button code stays here...
    
    // NEW: Handle the signup form if we're on the signup page
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      const statusElement = document.getElementById('signup-status');
      
      // Get plan from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const plan = urlParams.get('plan') || 'standard';
      const selectedPlanInput = document.getElementById('selected-plan');
      if (selectedPlanInput) {
        selectedPlanInput.value = plan;
      }
      
      signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        if (statusElement) {
          statusElement.textContent = 'Creating your account...';
        }
        
        // Get form data
        const formData = {
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          password: document.getElementById('password').value,
          plan: document.getElementById('selected-plan').value
        };
        
        try {
          // This is where your API call needs to happen
          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
          });
          
          const result = await response.json();
          
          if (result.success) {
            if (statusElement) {
              statusElement.textContent = 'Account created! Redirecting to payment...';
            }
            
            // Redirect to Stripe
            if (result.stripeUrl) {
              window.location.href = result.stripeUrl;
            } else {
              if (statusElement) {
                statusElement.textContent = 'Error: No payment URL received';
              }
            }
          } else {
            if (statusElement) {
              statusElement.textContent = 'Error: ' + (result.error || 'Signup failed');
            }
          }
          
        } catch (error) {
          console.error('Signup error:', error);
          if (statusElement) {
            statusElement.textContent = 'Error: Could not connect to server';
          }
        }
      });
    }
    
    // Your existing log statement...
    console.log('Signup links script loaded and executed');
  });