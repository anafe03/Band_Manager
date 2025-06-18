// frontend/js/documents.js - Complete document management functionality

// Global variables for document management
let selectedDocument = null;
let availableDocuments = [];

// Initialize document functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDocumentHandlers();
});

function initializeDocumentHandlers() {
    // Documents menu item click
    const documentsMenuItem = document.getElementById('documents-menu-item');
    if (documentsMenuItem) {
        documentsMenuItem.addEventListener('click', toggleDocumentsSidebar);
    }

    // Close button
    const closeBtn = document.getElementById('close-documents');
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleDocumentsSidebar);
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('documents-popup');
        const menuItem = document.getElementById('documents-menu-item');
        
        if (sidebar && sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuItem.contains(e.target)) {
            closeDocumentsSidebar();
        }
    });

    console.log('Document handlers initialized');
}

// Show/hide documents sidebar
function toggleDocumentsSidebar() {
    const documentsPopup = document.getElementById('documents-popup');
    const documentsMenuItem = document.getElementById('documents-menu-item');
    const chatMenuItem = document.querySelector('.menu-item'); // First menu item (Chat)
    
    if (documentsPopup && documentsMenuItem) {
        if (documentsPopup.classList.contains('active')) {
            // Close documents sidebar
            documentsPopup.classList.remove('active');
            documentsMenuItem.classList.remove('active');
            if (chatMenuItem) chatMenuItem.classList.add('active');
        } else {
            // Open documents sidebar
            documentsPopup.classList.add('active');
            documentsMenuItem.classList.add('active');
            if (chatMenuItem) chatMenuItem.classList.remove('active');
            
            // Auto-load documents when opening sidebar if not already loaded
            if (availableDocuments.length === 0) {
                loadStaticDocuments();
            }
        }
        console.log('Toggled documents sidebar');
    }
}

// Close documents sidebar
function closeDocumentsSidebar() {
    const documentsPopup = document.getElementById('documents-popup');
    const documentsMenuItem = document.getElementById('documents-menu-item');
    const chatMenuItem = document.querySelector('.menu-item'); // First menu item (Chat)
    
    if (documentsPopup && documentsMenuItem) {
        documentsPopup.classList.remove('active');
        documentsMenuItem.classList.remove('active');
        if (chatMenuItem) chatMenuItem.classList.add('active');
        console.log('Closed documents sidebar');
    }
}

// Load static documents from backend
async function loadStaticDocuments() {
    const loadingSpinner = document.getElementById('documents-loading');
    const messageContainer = document.getElementById('message-container');
    const documentsList = document.getElementById('documents-list');
    
    try {
        console.log('Loading static documents...');
        
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (documentsList) documentsList.innerHTML = '';
        if (messageContainer) messageContainer.innerHTML = '';

        // Try both local and production URLs
        let response;
        try {
            response = await fetch('/api/documents/static');
        } catch (localError) {
            console.log('Local fetch failed, trying production URL...');
            response = await fetch('https://vesty-app-fastapi.onrender.com/api/documents/static');
        }
        
        if (!response.ok) {
            throw new Error(`Failed to load documents: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        availableDocuments = data.documents || [];

        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (availableDocuments.length === 0) {
            if (documentsList) {
                documentsList.innerHTML = `
                    <div style="text-align: center; color: #666; font-style: italic; padding: 20px;">
                        <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3; display: block;"></i>
                        <p>No documents found in backend/static/documents folder</p>
                        <p style="font-size: 12px;">Add some PDF, DOCX, or TXT files to get started!</p>
                    </div>
                `;
            }
            showMessage('No documents found. Add files to backend/static/documents/', 'info');
            return;
        }

        // Display documents
        displayDocuments(availableDocuments);
        showMessage(`Found ${availableDocuments.length} documents ready for Q&A!`, 'success');

        console.log(`Loaded ${availableDocuments.length} documents`);

    } catch (error) {
        console.error('Error loading documents:', error);
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        showMessage(`Error loading documents: ${error.message}`, 'error');
        
        if (documentsList) {
            documentsList.innerHTML = `
                <div style="text-align: center; color: #dc3545; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Failed to load documents</p>
                    <p style="font-size: 12px;">${error.message}</p>
                </div>
            `;
        }
    }
}

// Display documents in the sidebar
function displayDocuments(documents) {
    const documentsList = document.getElementById('documents-list');
    
    if (!documentsList) {
        console.error('Documents list element not found');
        return;
    }
    
    if (documents.length === 0) {
        documentsList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No documents available</p>';
        return;
    }

    const documentsHTML = documents.map(doc => {
        const fileIcon = getFileIcon(doc.file_type || doc.filename);
        const fileSize = formatFileSize(doc.file_size || 0);
        
        return `
            <div class="document-item" onclick="selectDocument('${escapeHtml(doc.filename)}', this)">
                <div class="document-icon">
                    <i class="fas ${fileIcon}"></i>
                </div>
                <div class="document-info">
                    <h4>${escapeHtml(doc.filename)}</h4>
                    <p>${fileSize} • Static Document</p>
                </div>
            </div>
        `;
    }).join('');

    documentsList.innerHTML = documentsHTML;
    console.log(`Displayed ${documents.length} documents`);
}

// Select a document
function selectDocument(filename, element) {
    // Remove previous selection
    document.querySelectorAll('.document-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Add selection to clicked item
    if (element) {
        element.classList.add('selected');
    }
    
    selectedDocument = filename;

    // Enable and update the "Ask About Selected" button
    const askBtn = document.getElementById('ask-about-selected');
    if (askBtn) {
        askBtn.disabled = false;
        askBtn.innerHTML = `<i class="fas fa-question-circle"></i> Ask About "${filename.length > 15 ? filename.substring(0, 15) + '...' : filename}"`;
    }

    showMessage(`Selected: ${filename}`, 'info');
    console.log(`Selected document: ${filename}`);
}

// Ask about the selected document
async function askAboutSelected() {
    if (!selectedDocument) {
        showMessage('Please select a document first!', 'error');
        return;
    }

    // Create a more specific question about the selected document
    const question = `Please analyze the document "${selectedDocument}" and tell me what it contains. What are the key points and important information in this document?`;
    
    await askAboutDocuments(question);
    
    // Close the documents sidebar and switch back to chat
    closeDocumentsSidebar();
}

// Ask about documents via chat
async function askAboutDocuments(question) {
    console.log(`Asking about documents: ${question}`);
    
    // Close the documents sidebar first
    closeDocumentsSidebar();
    
    // Send the question to the chat
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.value = question;
        
        // Check if sendMessage function exists and call it
        if (typeof sendMessage === 'function') {
            sendMessage();
        } else {
            console.warn('sendMessage function not found - attempting to trigger manually');
            // Try to find and click the send button
            const sendBtn = document.querySelector('.chat-input button');
            if (sendBtn) {
                sendBtn.click();
            } else {
                showMessage('Chat function not available', 'error');
            }
        }
    } else {
        console.error('Chat input element not found');
        showMessage('Chat input not found', 'error');
    }
}

// Refresh document index
async function refreshDocumentIndex() {
    console.log('Refresh document index called');
    
    // For now, this will call the agent's refresh tool
    const question = 'Please refresh the document index to make all uploaded documents searchable for Q&A.';
    await askAboutDocuments(question);
}

// Utility functions
function getFileIcon(fileType) {
    const type = (fileType || '').toLowerCase();
    if (type.includes('pdf')) return 'fa-file-pdf';
    if (type.includes('doc')) return 'fa-file-word';
    if (type.includes('txt')) return 'fa-file-alt';
    if (type.includes('xls')) return 'fa-file-excel';
    if (type.includes('ppt')) return 'fa-file-powerpoint';
    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(message, type) {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    
    let messageClass;
    switch(type) {
        case 'error':
            messageClass = 'error-message';
            break;
        case 'success':
            messageClass = 'success-message';
            break;
        case 'info':
        default:
            messageClass = 'success-message'; // Use success styling for info
            break;
    }
    
    messageContainer.innerHTML = `<div class="${messageClass}">${escapeHtml(message)}</div>`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (messageContainer) {
            messageContainer.innerHTML = '';
        }
    }, 3000);
}

// Use suggestion function (for compatibility with existing chat suggestions)
function usesuggestion(button) {
    const chatInput = document.getElementById('chatInput');
    if (chatInput && button) {
        chatInput.value = button.textContent;
        if (typeof sendMessage === 'function') {
            sendMessage();
        }
    }
}

// Export functions for global access
window.loadStaticDocuments = loadStaticDocuments;
window.selectDocument = selectDocument;
window.askAboutSelected = askAboutSelected;
window.askAboutDocuments = askAboutDocuments;
window.refreshDocumentIndex = refreshDocumentIndex;
window.toggleDocumentsSidebar = toggleDocumentsSidebar;
window.usesuggestion = usesuggestion;