// Avatar Upload Module
class AvatarUpload {
    constructor() {
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.loadSavedProfile();
    }
  
    setupEventListeners() {
      const avatarContainer = document.querySelector('.avatar-container');
      const avatarUpload = document.getElementById('avatar-upload');
  
      // Click on avatar container triggers file input
      if (avatarContainer) {
        avatarContainer.addEventListener('click', () => {
          avatarUpload.click();
        });
      }
  
      // Handle file selection
      if (avatarUpload) {
        avatarUpload.addEventListener('change', (event) => {
          this.handleFileSelection(event);
        });
      }
    }
  
    loadSavedProfile() {
      const savedProfileImage = localStorage.getItem('profileImage');
      const profileImage = document.getElementById('profile-image');
      const avatarDefault = document.getElementById('avatar-default');
  
      if (savedProfileImage && profileImage && avatarDefault) {
        profileImage.src = savedProfileImage;
        profileImage.style.display = 'block';
        avatarDefault.style.display = 'none';
      }
    }
  
    handleFileSelection(event) {
      const file = event.target.files[0];
  
      if (file) {
        // Validate file is an image
        if (!file.type.match('image.*')) {
          alert('Please select an image file');
          return;
        }
  
        // File size validation (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should not exceed 5MB');
          return;
        }
  
        // Read and display the image
        const reader = new FileReader();
        reader.onload = (e) => {
          this.updateProfileImage(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  
    updateProfileImage(imageSrc) {
      const profileImage = document.getElementById('profile-image');
      const avatarDefault = document.getElementById('avatar-default');
  
      if (profileImage && avatarDefault) {
        // Update the profile image
        profileImage.src = imageSrc;
        profileImage.style.display = 'block';
        avatarDefault.style.display = 'none';
  
        // Save to localStorage for persistence
        localStorage.setItem('profileImage', imageSrc);
  
        // Update any other instances of the user avatar on the page
        const allAvatarImages = document.querySelectorAll('.user-avatar-img');
        allAvatarImages.forEach(img => {
          img.src = imageSrc;
        });
  
        console.log('Profile image updated successfully');
      }
    }
  
    // Method to clear profile image
    clearProfileImage() {
      const profileImage = document.getElementById('profile-image');
      const avatarDefault = document.getElementById('avatar-default');
  
      if (profileImage && avatarDefault) {
        profileImage.style.display = 'none';
        avatarDefault.style.display = 'block';
        localStorage.removeItem('profileImage');
      }
    }
  
    // Method to get current profile image
    getCurrentProfileImage() {
      return localStorage.getItem('profileImage');
    }
  }
  
  // Initialize avatar upload
  let avatarUpload;
  document.addEventListener('DOMContentLoaded', () => {
    avatarUpload = new AvatarUpload();
  });