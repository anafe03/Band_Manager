/**
 * File Upload Functionality
 * Handles image and document file uploads for SelfNVestAi
 */

document.addEventListener('DOMContentLoaded', function() {
  setupToggleUploadBtn();
});

/**
 * Set up toggle upload button functionality
 * Allows users to share images and files via the + button
 */
function setupToggleUploadBtn() {
  const toggleUploadBtn = document.getElementById('toggleUploadBtn');
  const chatBox = document.getElementById('chatBox');
  
  if (!toggleUploadBtn) return;
  
  // Create hidden file input with broader file type acceptance
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // Create container for file previews if it doesn't exist
  let filePreviewContainer = document.querySelector('.file-preview-container');
  if (!filePreviewContainer) {
    filePreviewContainer = document.createElement('div');
    filePreviewContainer.className = 'file-preview-container';
    filePreviewContainer.style.display = 'none';
    
    // Insert the preview container before the chat input container
    const chatInputContainer = document.querySelector('.chat-input-container');
    if (chatInputContainer) {
      chatInputContainer.parentNode.insertBefore(filePreviewContainer, chatInputContainer);
    }
  }
  
  // Handle toggle upload button click
  toggleUploadBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Handle file selection
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      // Show the file preview container
      filePreviewContainer.style.display = 'flex';
      
      // Process each selected file
      Array.from(fileInput.files).forEach(file => {
        // Create file preview item
        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview-item';
        fileItem.title = file.name;
        
        // Store file data for later use
        fileItem.dataset.fileData = URL.createObjectURL(file);
        fileItem.dataset.fileName = file.name;
        fileItem.dataset.fileType = file.type;
        fileItem.dataset.fileSize = file.size;
        
        // Create preview content based on file type
        if (file.type.startsWith('image/')) {
          // For images, show thumbnail
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.className = 'file-preview-thumbnail';
          fileItem.appendChild(img);
        } else {
          // For documents, show icon based on extension
          const icon = document.createElement('i');
          const extension = file.name.split('.').pop().toLowerCase();
          
          switch(extension) {
            case 'pdf':
              icon.className = 'fas fa-file-pdf';
              break;
            case 'doc':
            case 'docx':
              icon.className = 'fas fa-file-word';
              break;
            case 'xls':
            case 'xlsx':
              icon.className = 'fas fa-file-excel';
              break;
            case 'csv':
              icon.className = 'fas fa-file-csv';
              break;
            default:
              icon.className = 'fas fa-file-alt';
          }
          
          icon.style.fontSize = '2rem';
          icon.style.color = '#33443c';
          fileItem.appendChild(icon);
          
          // Add file name
          const fileName = document.createElement('div');
          fileName.className = 'file-name';
          fileName.textContent = file.name.length > 15 ? 
            file.name.substring(0, 12) + '...' : file.name;
          fileItem.appendChild(fileName);
        }
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileItem.remove();
          
          // Hide preview container if no files left
          if (filePreviewContainer.children.length === 0) {
            filePreviewContainer.style.display = 'none';
          }
        });
        fileItem.appendChild(removeBtn);
        
        // Add to preview container
        filePreviewContainer.appendChild(fileItem);
      });
      
      // Reset file input
      fileInput.value = '';
    }
  });
  
  // Extend the sendMessage function to handle file uploads
  const originalSendMessage = window.sendMessage || function() {};
  
  window.sendMessage = function() {
    const userInput = document.getElementById('chatInput');
    const text = userInput.value.trim();
    const files = Array.from(document.querySelectorAll('.file-preview-item'));
    
    // If there are files to share
    if (files.length > 0) {
      // Create message containing files
      const fileMessage = document.createElement('div');
      fileMessage.className = 'message user-message';
      
      // Create time element
      const timeElement = document.createElement('div');
      timeElement.className = 'message-time';
      timeElement.textContent = getCurrentTime();
      fileMessage.appendChild(timeElement);
      
      // Create avatar container
      const avatarContainer = document.createElement('div');
      avatarContainer.className = 'message-avatar-container';
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.textContent = 'You';
      avatarContainer.appendChild(avatar);
      fileMessage.appendChild(avatarContainer);
      
      // Create message content
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      
      // Add text if provided
      if (text) {
        const textElement = document.createElement('p');
        textElement.textContent = text;
        messageContent.appendChild(textElement);
        
        // Clear input field
        userInput.value = '';
      }
      
      // Create file attachments container
      const attachmentsContainer = document.createElement('div');
      attachmentsContainer.className = 'message-attachments';
      
      // Add each file as an attachment
      files.forEach(fileItem => {
        const attachment = document.createElement('div');
        attachment.className = 'message-attachment';
        
        if (fileItem.dataset.fileType.startsWith('image/')) {
          // For images
          const img = document.createElement('img');
          img.src = fileItem.dataset.fileData;
          img.alt = fileItem.dataset.fileName;
          img.className = 'attachment-image';
          
          // Make image clickable to view full size
          img.addEventListener('click', () => {
            window.open(fileItem.dataset.fileData, '_blank');
          });
          
          attachment.appendChild(img);
        } else {
          // For documents
          const docContainer = document.createElement('div');
          docContainer.className = 'document-attachment';
          
          // Copy the icon from the preview
          const icon = fileItem.querySelector('i').cloneNode(true);
          icon.style.fontSize = '1.5rem';
          docContainer.appendChild(icon);
          
          // Add file name
          const fileName = document.createElement('span');
          fileName.textContent = fileItem.dataset.fileName;
          docContainer.appendChild(fileName);
          
          // Add file size
          const fileSize = document.createElement('span');
          fileSize.className = 'file-size';
          fileSize.textContent = formatFileSize(parseInt(fileItem.dataset.fileSize));
          docContainer.appendChild(fileSize);
          
          attachment.appendChild(docContainer);
        }
        
        attachmentsContainer.appendChild(attachment);
      });
      
      messageContent.appendChild(attachmentsContainer);
      fileMessage.appendChild(messageContent);
      
      // Add to chat box
      chatBox.appendChild(fileMessage);
      
      // Clear file previews
      filePreviewContainer.innerHTML = '';
      filePreviewContainer.style.display = 'none';
      
      // Scroll to bottom
      scrollToBottom();
      
      // Show typing indicator for assistant response
      showTypingIndicator();
      
      // In a real app, you would send the files to the server here
      // For now, simulate assistant response acknowledging the files
      setTimeout(() => {
        removeTypingIndicator();
        
        // Add assistant response
        const assistantMessage = document.createElement('div');
        assistantMessage.className = 'message assistant-message';
        
        // Create time element
        const assistantTime = document.createElement('div');
        assistantTime.className = 'message-time';
        assistantTime.textContent = getCurrentTime();
        assistantMessage.appendChild(assistantTime);
        
        // Create avatar container
        const assistantAvatarContainer = document.createElement('div');
        assistantAvatarContainer.className = 'message-avatar-container';
        
        const assistantAvatar = document.createElement('div');
        assistantAvatar.className = 'message-avatar';
        assistantAvatar.textContent = 'AI';
        assistantAvatarContainer.appendChild(assistantAvatar);
        assistantMessage.appendChild(assistantAvatarContainer);
        
        // Create message content
        const assistantContent = document.createElement('div');
        assistantContent.className = 'message-content';
        
        const responseText = document.createElement('p');
        responseText.textContent = `I've received your ${files.length > 1 ? 'files' : 'file'}. Thanks for sharing! How can I help with ${files.length > 1 ? 'them' : 'it'}?`;
        assistantContent.appendChild(responseText);
        
        assistantMessage.appendChild(assistantContent);
        chatBox.appendChild(assistantMessage);
        
        // Scroll to bottom
        scrollToBottom();
      }, 1500);
      
      return;
    }
    
    // If no files, proceed with original message sending
    if (text) {
      originalSendMessage();
    }
  };
}

/**
 * Format file size in bytes to human readable format
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * Get current time in HH:MM format
 */
function getCurrentTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  const chatBox = document.getElementById('chatBox');
  if (chatBox) {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
