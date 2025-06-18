// timeline-manager.js
// Timeline management functionality for assistant.html

class TimelineManager {
    constructor() {
        this.timelineSteps = [];
        this.nextStepId = 6; // Start after existing 5 steps
        this.init();
    }

    init() {
        console.log('🚀 Initializing Timeline Manager...');
        this.loadTimelineFromLocalStorage();
        this.setupEventListeners();
        this.updateProgress();
    }

    setupEventListeners() {
        // Add timeline toggle button
        const toggleBtn = document.getElementById('add-timeline-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', this.toggleAddForm.bind(this));
        }

        // Add form submission handling
        const addBtn = document.querySelector('.add-timeline-btn');
        if (addBtn) {
            addBtn.addEventListener('click', this.addTimelineItem.bind(this));
        }

        const cancelBtn = document.querySelector('.cancel-timeline-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.cancelAddTimeline.bind(this));
        }

        // Handle Enter key in form inputs
        const titleInput = document.getElementById('timeline-title');
        if (titleInput) {
            titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTimelineItem();
                }
            });
        }

        // Setup drag and drop for timeline steps
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const timelineSteps = document.getElementById('timeline-steps');
        if (!timelineSteps) return;

        // Make all timeline steps draggable and add drag handles
        this.makeDraggable();

        // Add global event listeners for drag and drop
        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    makeDraggable() {
        const timelineSteps = document.querySelectorAll('.timeline-step');
        timelineSteps.forEach((step, index) => {
            step.draggable = true;
            step.dataset.originalIndex = index;
            
            // Add drag handle if it doesn't exist
            if (!step.querySelector('.drag-handle')) {
                const dragHandle = document.createElement('div');
                dragHandle.className = 'drag-handle';
                dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
                dragHandle.title = 'Drag to reorder';
                step.insertBefore(dragHandle, step.firstChild);
            }
        });
    }

    handleDragStart(e) {
        if (!e.target.classList.contains('timeline-step')) return;
        
        this.draggedElement = e.target;
        this.draggedElement.classList.add('dragging');
        
        const timelineSteps = document.getElementById('timeline-steps');
        timelineSteps.classList.add('drag-active');
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handleDragOver(e) {
        if (this.draggedElement) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
    }

    handleDragEnter(e) {
        if (e.target.classList.contains('timeline-step') && e.target !== this.draggedElement) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('timeline-step')) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        if (!this.draggedElement) return;
        
        e.preventDefault();
        
        const dropTarget = e.target.closest('.timeline-step');
        if (dropTarget && dropTarget !== this.draggedElement) {
            const timelineSteps = document.getElementById('timeline-steps');
            const allSteps = Array.from(timelineSteps.children);
            const draggedIndex = allSteps.indexOf(this.draggedElement);
            const targetIndex = allSteps.indexOf(dropTarget);
            
            // Determine where to insert the dragged element
            if (draggedIndex < targetIndex) {
                timelineSteps.insertBefore(this.draggedElement, dropTarget.nextSibling);
            } else {
                timelineSteps.insertBefore(this.draggedElement, dropTarget);
            }
            
            // Update the visual feedback
            this.updateStepIndices();
            this.saveTimelineToLocalStorage();
            
            // Show success feedback
            this.showReorderFeedback();
        }
    }

    handleDragEnd(e) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
        
        // Remove all drag-related classes
        document.querySelectorAll('.timeline-step').forEach(step => {
            step.classList.remove('drag-over');
        });
        
        const timelineSteps = document.getElementById('timeline-steps');
        if (timelineSteps) {
            timelineSteps.classList.remove('drag-active');
        }
    }

    updateStepIndices() {
        const timelineSteps = document.querySelectorAll('.timeline-step');
        timelineSteps.forEach((step, index) => {
            step.dataset.originalIndex = index;
        });
    }

    showReorderFeedback() {
        // Create a temporary success message
        const timelineContent = document.querySelector('.timeline-content');
        const successMsg = document.createElement('div');
        successMsg.className = 'reorder-success';
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Timeline reordered successfully!';
        successMsg.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 1001;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;
        
        timelineContent.appendChild(successMsg);
        
        // Animate in
        setTimeout(() => {
            successMsg.style.opacity = '1';
            successMsg.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successMsg.style.opacity = '0';
            successMsg.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.remove();
                }
            }, 300);
        }, 3000);
    }

    toggleAddForm() {
        const form = document.getElementById('add-timeline-form');
        const toggleBtn = document.getElementById('add-timeline-toggle');
        
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-minus"></i>';
            toggleBtn.style.transform = 'rotate(45deg)';
            
            // Focus on title input
            const titleInput = document.getElementById('timeline-title');
            if (titleInput) {
                setTimeout(() => titleInput.focus(), 100);
            }
        } else {
            this.hideAddForm();
        }
    }

    hideAddForm() {
        const form = document.getElementById('add-timeline-form');
        const toggleBtn = document.getElementById('add-timeline-toggle');
        
        form.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
        toggleBtn.style.transform = 'rotate(0deg)';
    }

    addTimelineItem() {
        const titleInput = document.getElementById('timeline-title');
        const descriptionInput = document.getElementById('timeline-description');
        const iconSelect = document.getElementById('timeline-icon');
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const iconClass = iconSelect.value;
        
        if (!title) {
            alert('Please enter a task title');
            titleInput.focus();
            return;
        }

        if (!description) {
            alert('Please enter a task description');
            descriptionInput.focus();
            return;
        }

        const newStep = {
            id: this.nextStepId++,
            title: title,
            description: description,
            iconClass: iconClass,
            status: 'pending',
            dateAdded: new Date().toLocaleDateString()
        };

        this.addStepToDOM(newStep);
        this.saveTimelineToLocalStorage();
        this.clearForm();
        this.hideAddForm();
        this.updateProgress();

        console.log('✅ Timeline item added:', newStep);
    }

    addStepToDOM(step) {
        const timelineSteps = document.getElementById('timeline-steps');
        const stepElement = document.createElement('div');
        stepElement.className = 'timeline-step pending clickable';
        stepElement.setAttribute('onclick', 'toggleTimelineStep(this)');
        stepElement.setAttribute('data-step-id', step.id);
        stepElement.setAttribute('data-user-added', 'true');
        stepElement.draggable = true;

        stepElement.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="step-icon">
                <i class="fas ${step.iconClass}"></i>
            </div>
            <div class="step-content">
                <h4>${step.title}</h4>
                <p>${step.description}</p>
                <span class="step-date">${step.dateAdded}</span>
            </div>
            <div class="step-checkbox">
                <i class="fas fa-circle"></i>
            </div>
            <div class="step-actions">
                <button class="delete-step-btn" onclick="deleteTimelineStep(event, ${step.id})" title="Delete this item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        timelineSteps.appendChild(stepElement);
        
        // Update the dataset for proper indexing
        const allSteps = timelineSteps.querySelectorAll('.timeline-step');
        stepElement.dataset.originalIndex = allSteps.length - 1;
    }

    clearForm() {
        document.getElementById('timeline-title').value = '';
        document.getElementById('timeline-description').value = '';
        document.getElementById('timeline-icon').selectedIndex = 0;
    }

    cancelAddTimeline() {
        this.clearForm();
        this.hideAddForm();
    }

    toggleTimelineStep(stepElement) {
        const checkbox = stepElement.querySelector('.step-checkbox i');
        const stepIcon = stepElement.querySelector('.step-icon i');
        const stepDate = stepElement.querySelector('.step-date');
        
        if (stepElement.classList.contains('completed')) {
            // Mark as pending
            stepElement.classList.remove('completed');
            stepElement.classList.add('pending');
            checkbox.className = 'fas fa-circle';
            stepDate.textContent = 'Pending';
            
            // Change icon back to original or clock
            if (!stepIcon.classList.contains('fa-check')) {
                stepIcon.className = 'fas fa-clock';
            }
        } else {
            // Mark as completed
            stepElement.classList.remove('pending');
            stepElement.classList.add('completed');
            checkbox.className = 'fas fa-check-circle';
            stepDate.textContent = new Date().toLocaleDateString();
            
            // Change icon to check
            stepIcon.className = 'fas fa-check';
        }

        this.updateProgress();
        this.saveTimelineToLocalStorage();
        
        // Visual feedback
        stepElement.style.transform = 'scale(0.98)';
        setTimeout(() => {
            stepElement.style.transform = 'scale(1)';
        }, 150);
    }

    deleteTimelineStep(event, stepId) {
        event.stopPropagation(); // Prevent triggering the step toggle
        
        if (confirm('Are you sure you want to delete this timeline item?')) {
            const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
            if (stepElement && stepElement.getAttribute('data-user-added') === 'true') {
                stepElement.remove();
                this.updateProgress();
                this.saveTimelineToLocalStorage();
                console.log('🗑️ Timeline item deleted:', stepId);
            } else {
                alert('Cannot delete default timeline items');
            }
        }
    }

    updateProgress() {
        const allSteps = document.querySelectorAll('.timeline-step');
        const completedSteps = document.querySelectorAll('.timeline-step.completed');
        
        const totalSteps = allSteps.length;
        const completedCount = completedSteps.length;
        const progressPercentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progressPercentage}% Complete`;
        }

        console.log(`📊 Progress updated: ${completedCount}/${totalSteps} (${progressPercentage}%)`);
    }

    saveTimelineToLocalStorage() {
        const userSteps = [];
        const allSteps = document.querySelectorAll('.timeline-step');
        
        allSteps.forEach(step => {
            const stepId = step.getAttribute('data-step-id');
            const isUserAdded = step.getAttribute('data-user-added') === 'true';
            const isCompleted = step.classList.contains('completed');
            
            userSteps.push({
                id: stepId,
                isUserAdded: isUserAdded,
                isCompleted: isCompleted,
                title: step.querySelector('h4')?.textContent || '',
                description: step.querySelector('p')?.textContent || '',
                iconClass: step.querySelector('.step-icon i')?.className.split(' ').pop() || 'fa-tasks'
            });
        });
        
        localStorage.setItem('timeline-steps', JSON.stringify(userSteps));
        console.log('💾 Timeline saved to localStorage');
    }

    loadTimelineFromLocalStorage() {
        const saved = localStorage.getItem('timeline-steps');
        if (saved) {
            try {
                const steps = JSON.parse(saved);
                console.log('📂 Loading timeline from localStorage:', steps);
                
                // Update existing steps status
                steps.forEach(step => {
                    const stepElement = document.querySelector(`[data-step-id="${step.id}"]`);
                    if (stepElement) {
                        if (step.isCompleted && !stepElement.classList.contains('completed')) {
                            this.toggleTimelineStep(stepElement);
                        }
                    } else if (step.isUserAdded) {
                        // Recreate user-added steps
                        const newStep = {
                            id: parseInt(step.id),
                            title: step.title,
                            description: step.description,
                            iconClass: step.iconClass,
                            status: step.isCompleted ? 'completed' : 'pending',
                            dateAdded: 'Previously added'
                        };
                        this.addStepToDOM(newStep);
                        this.nextStepId = Math.max(this.nextStepId, parseInt(step.id) + 1);
                    }
                });
                
                this.updateProgress();
            } catch (error) {
                console.error('❌ Error loading timeline from localStorage:', error);
            }
        }
    }
}

// Global functions for HTML onclick handlers
function toggleTimelineStep(stepElement) {
    if (window.timelineManager) {
        window.timelineManager.toggleTimelineStep(stepElement);
    }
}

function addTimelineItem() {
    if (window.timelineManager) {
        window.timelineManager.addTimelineItem();
    }
}

function cancelAddTimeline() {
    if (window.timelineManager) {
        window.timelineManager.cancelAddTimeline();
    }
}

function deleteTimelineStep(event, stepId) {
    if (window.timelineManager) {
        window.timelineManager.deleteTimelineStep(event, stepId);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize timeline manager if timeline elements exist
    if (document.getElementById('timeline-steps')) {
        window.timelineManager = new TimelineManager();
        console.log('✅ Timeline Manager initialized');
    }
});

// Make functions globally available
window.toggleTimelineStep = toggleTimelineStep;
window.addTimelineItem = addTimelineItem;
window.cancelAddTimeline = cancelAddTimeline;
window.deleteTimelineStep = deleteTimelineStep;