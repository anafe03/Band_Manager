/**
 * Minimal Chat Functionality
 * Handles the plus button toggle and file uploads
 */

document.addEventListener('DOMContentLoaded', function() {
  setupToggleUploadButton();
  setupUploadOptions();
  setupTextareaAutoResize();
});

/**
 * Set up the plus button to toggle upload options
 */
function setupToggleUploadButton() {
  const toggleBtn = document.getElementById('toggleUploadBtn');
  const uploadOptions = document.getElementById('uploadOptions');
  
  if (!toggleBtn || !uploadOptions) return;
  
  toggleBtn.addEventListener('click', () => {
    const isVisible = uploadOptions.style.display !== 'none';
    
    if (isVisible) {
      uploadOptions.style.display = 'none';
      // Reset icon to plus
      toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
    } else {
      uploadOptions.style.display = 'flex';
      // Change icon to X when options are open
      toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
    }
  });
  
  // Close upload options when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (uploadOptions.style.display !== 'none' && 
        !uploadOptions.contains(e.target) && 
        e.target !== toggleBtn && 
        !toggleBtn.contains(e.target)) {
      uploadOptions.style.display = 'none';
      toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
    }
  });
}

/**
 * Set up the upload option buttons
 */
function setupUploadOptions() {
  const uploadOptions = document.querySelectorAll('.upload-option');
  const attachmentPreview = document.querySelector('.attachment-preview');
  
  if (!uploadOptions.length || !attachmentPreview) return;
  
  // Create hidden file inputs for each upload option
  uploadOptions.forEach((option, index) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.display = 'none';
    
    // Set accept attribute based on button type
    if (option.title.includes('image')) {
      fileInput.accept = 'image/*';
    } else if (option.title.includes('document')) {
      fileInput.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx';
    } else if (option.title.includes('video')) {
      fileInput.accept = 'video/*';
    }
    
    document.body.appendChild(fileInput);
    
    // Handle click on upload option button
    option.addEventListener('click', () => {
      fileInput.click();
      
      // Hide the upload options after selection
      const uploadOptions = document.getElementById('uploadOptions');
      const toggleBtn = document.getElementById('toggleUploadBtn');
      if (uploadOptions && toggleBtn) {
        uploadOptions.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
      }
    });
    
    // Handle file selection
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        attachmentPreview.style.display = 'flex';
        
        Array.from(fileInput.files).forEach(file => {
          // Create attachment preview item
          const attachmentItem = document.createElement('div');
          attachmentItem.className = 'attachment-item';
          
          // Handle different file types
          if (file.type.startsWith('image/')) {
            // For images
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            attachmentItem.appendChild(img);
          } else {
            // For documents and other files
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-icon';
            
            // Choose icon based on file type
            let iconClass = 'fas fa-file';
            if (file.type.includes('pdf')) {
              iconClass = 'fas fa-file-pdf';
            } else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
              iconClass = 'fas fa-file-word';
            } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
              iconClass = 'fas fa-file-excel';
            } else if (file.type.includes('video')) {
              iconClass = 'fas fa-file-video';
            }
            
            fileIcon.innerHTML = `<i class="${iconClass}"></i><span>${file.name.substring(0, 10)}${file.name.length > 10 ? '...' : ''}</span>`;
            attachmentItem.appendChild(fileIcon);
          }
          
          // Create remove button
          const removeBtn = document.createElement('button');
          removeBtn.className = 'remove-attachment';
          removeBtn.innerHTML = '<i class="fas fa-times"></i>';
          removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            attachmentItem.remove();
            
            // Hide preview container if no attachments left
            if (attachmentPreview.children.length === 0) {
              attachmentPreview.style.display = 'none';
            }
          });
          attachmentItem.appendChild(removeBtn);
          
          // Add to preview container
          attachmentPreview.appendChild(attachmentItem);
        });
        
        // Reset file input
        fileInput.value = '';
      }
    });
  });
}

/**
 * Set up textarea auto-resize functionality
 */
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
      if (typeof sendMessage === 'function') {
        sendMessage();
      }
    }
  });
}

/**
 * Auto-resize textarea as user types
 */
function autoResizeTextarea(textarea) {
  if (!textarea) return;
  
  // Reset height to calculate scroll height correctly
  textarea.style.height = 'auto';
  
  // Set new height based on content (with max height constraint handled by CSS)
  const newHeight = Math.min(textarea.scrollHeight, 100);
  textarea.style.height = newHeight + 'px';
}
