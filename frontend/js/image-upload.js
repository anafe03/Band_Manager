/**
 * Image Upload Functionality for SelfNVest
 * Handles drag and drop, file selection, and preview generation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const dropzone = document.querySelector('.upload-dropzone');
    const fileInput = document.getElementById('property-images');
    const previewContainer = document.querySelector('.uploaded-images-preview');
    
    if (!dropzone || !fileInput || !previewContainer) return;
    
    // Handle click on dropzone
    dropzone.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropzone.classList.add('highlight');
    }
    
    function unhighlight() {
        dropzone.classList.remove('highlight');
    }
    
    dropzone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Process the selected files
    function handleFiles(files) {
        if (!files || files.length === 0) return;
        
        // Convert FileList to Array for easier manipulation
        const filesArray = Array.from(files);
        
        // Filter for only image files
        const imageFiles = filesArray.filter(file => file.type.startsWith('image/'));
        
        // Create previews for each image
        imageFiles.forEach(createImagePreview);
    }
    
    // Create preview for a single image
    function createImagePreview(file) {
        // Create container for the preview
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        
        // Create image element
        const img = document.createElement('img');
        img.file = file;
        previewItem.appendChild(img);
        
        // Create remove button
        const removeBtn = document.createElement('div');
        removeBtn.className = 'image-preview-remove';
        removeBtn.innerHTML = '×';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            previewItem.remove();
        });
        previewItem.appendChild(removeBtn);
        
        // Add to preview container
        previewContainer.appendChild(previewItem);
        
        // Read the file and set the image source
        const reader = new FileReader();
        reader.onload = (function(aImg) { 
            return function(e) { 
                aImg.src = e.target.result; 
            }; 
        })(img);
        reader.readAsDataURL(file);
    }
    
    // Add highlight class for styling on hover
    document.querySelector('.upload-dropzone').addEventListener('mouseenter', function() {
        this.classList.add('highlight');
    });
    
    document.querySelector('.upload-dropzone').addEventListener('mouseleave', function() {
        this.classList.remove('highlight');
    });
});
