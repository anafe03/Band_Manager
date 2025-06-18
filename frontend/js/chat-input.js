/**
 * Chat Input Functionality
 * Handles attachment uploads and message sending
 */

document.addEventListener('DOMContentLoaded', function() {
  setupAttachmentUpload();
  setupTextareaAutoResize();
});

/**
 * Set up attachment upload functionality
 */
function setupAttachmentUpload() {
  const attachmentBtn = document.querySelector('.attachment-btn');
  const attachmentPreview = document.querySelector('.attachment-preview');
  
  if (!attachmentBtn) return;
  
  // Create hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // Handle attachment button click
  attachmentBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Handle file selection
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      attachmentPreview.style.display = 'flex';
      
      // Process each selected file
      Array.from(fileInput.files).forEach(file => {
        // Create attachment preview item
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'attachment-item';
        
        // Create image element
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        attachmentItem.appendChild(img);
        
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
