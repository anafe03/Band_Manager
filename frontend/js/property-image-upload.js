/**
 * Property Image Upload Script
 * Handles the functionality for adding images to empty gallery slides
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get all empty slides with placeholders
    const emptySlides = document.querySelectorAll('.empty-slide');
    
    if (!emptySlides.length) return;
    
    // Add click event to each empty slide
    emptySlides.forEach((slide, index) => {
        const placeholder = slide.querySelector('.add-image-placeholder');
        
        if (placeholder) {
            placeholder.addEventListener('click', function() {
                // Create a file input element
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                
                // Add the file input to the document and trigger a click
                document.body.appendChild(fileInput);
                fileInput.click();
                
                // Handle file selection
                fileInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        const file = this.files[0];
                        
                        // Only process image files
                        if (!file.type.match('image.*')) {
                            alert('Please select an image file.');
                            return;
                        }
                        
                        // Read the file and set it as the slide background
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            // Create image element
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.alt = `Property Image ${index + 1}`;
                            
                            // Remove placeholder and add image
                            placeholder.remove();
                            slide.appendChild(img);
                            slide.classList.remove('empty-slide');
                            
                            // Add remove button
                            addRemoveButton(slide);
                        };
                        
                        reader.readAsDataURL(file);
                    }
                    
                    // Remove the file input from the document
                    document.body.removeChild(fileInput);
                });
            });
        }
    });
    
    // Function to add a remove button to uploaded images
    function addRemoveButton(slide) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-btn';
        removeBtn.innerHTML = '×';
        
        // Add click event to remove button
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Get the slide index
            const slideIndex = Array.from(slide.parentNode.children).indexOf(slide);
            
            // Remove the image
            const img = slide.querySelector('img');
            if (img) {
                slide.removeChild(img);
            }
            
            // Remove the remove button
            slide.removeChild(removeBtn);
            
            // Add placeholder back
            const placeholder = document.createElement('div');
            placeholder.className = 'add-image-placeholder';
            
            const icon = document.createElement('div');
            icon.className = 'add-image-icon';
            icon.innerHTML = '+';
            
            const text = document.createElement('p');
            text.textContent = `Add Property Image ${slideIndex + 1}`;
            
            placeholder.appendChild(icon);
            placeholder.appendChild(text);
            slide.appendChild(placeholder);
            
            // Add empty-slide class back
            slide.classList.add('empty-slide');
            
            // Add click event to the new placeholder
            placeholder.addEventListener('click', function() {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                
                document.body.appendChild(fileInput);
                fileInput.click();
                
                fileInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        const file = this.files[0];
                        
                        if (!file.type.match('image.*')) {
                            alert('Please select an image file.');
                            return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.alt = `Property Image ${slideIndex + 1}`;
                            
                            placeholder.remove();
                            slide.appendChild(img);
                            slide.classList.remove('empty-slide');
                            
                            addRemoveButton(slide);
                        };
                        
                        reader.readAsDataURL(file);
                    }
                    
                    document.body.removeChild(fileInput);
                });
            });
        });
        
        slide.appendChild(removeBtn);
    }
});
