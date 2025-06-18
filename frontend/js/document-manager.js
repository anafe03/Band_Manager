// Document Manager JavaScript
// Handles document upload, viewing, and management functionality

class DocumentManager {
    constructor() {
        this.documents = [];
        this.currentDocument = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDocuments();
    }

    setupEventListeners() {
        // Document upload handling
        const uploadInput = document.getElementById('document-upload');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Drag and drop handling
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
            uploadArea.addEventListener('click', () => uploadInput?.click());
        }

        // Document item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.document-item')) {
                const documentItem = e.target.closest('.document-item');
                const documentName = documentItem.querySelector('h5')?.textContent;
                const documentType = documentItem.getAttribute('data-type') || 'pdf';
                this.openDocument(documentName, documentType);
            }
        });
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => this.processFile(file));
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        files.forEach(file => this.processFile(file));
    }

    processFile(file) {
        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        if (!allowedTypes.includes(file.type)) {
            this.showError(`File type ${file.type} is not supported`);
            return;
        }

        // Create document object
        const document = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            uploadDate: new Date(),
            file: file
        };

        this.documents.push(document);
        this.addDocumentToGrid(document);
        this.showSuccess(`${file.name} uploaded successfully`);
    }

    addDocumentToGrid(document) {
        const grid = document.getElementById('documents-grid');
        if (!grid) return;

        const documentElement = this.createDocumentElement(document);
        grid.appendChild(documentElement);
    }

    createDocumentElement(doc) {
        const div = document.createElement('div');
        div.className = 'document-item';
        div.setAttribute('data-type', this.getDocumentType(doc.type));
        
        const icon = this.getDocumentIcon(doc.type);
        const size = this.formatFileSize(doc.size);
        const date = this.formatDate(doc.uploadDate);

        div.innerHTML = `
            <div class="document-icon">
                <i class="${icon}"></i>
            </div>
            <div class="document-info">
                <h5>${doc.name}</h5>
                <p>${this.getFileTypeLabel(doc.type)} • ${size}</p>
                <span class="document-date">${date}</span>
            </div>
        `;

        return div;
    }

    getDocumentIcon(type) {
        const iconMap = {
            'application/pdf': 'fas fa-file-pdf',
            'application/msword': 'fas fa-file-word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word',
            'text/plain': 'fas fa-file-alt',
            'image/jpeg': 'fas fa-file-image',
            'image/png': 'fas fa-file-image',
            'image/gif': 'fas fa-file-image'
        };
        return iconMap[type] || 'fas fa-file';
    }

    getDocumentType(mimeType) {
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('word')) return 'doc';
        if (mimeType.includes('image')) return 'images';
        return 'doc';
    }

    getFileTypeLabel(type) {
        const labelMap = {
            'application/pdf': 'PDF',
            'application/msword': 'DOC',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
            'text/plain': 'TXT',
            'image/jpeg': 'JPG',
            'image/png': 'PNG',
            'image/gif': 'GIF'
        };
        return labelMap[type] || 'FILE';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    openDocument(documentName, documentType) {
        // This function is called when a document is clicked
        // It should open the document split view
        if (typeof openDocumentSplitView === 'function') {
            openDocumentSplitView(documentName, documentType);
        } else {
            console.log(`Opening document: ${documentName} (${documentType})`);
        }
    }

    loadDocuments() {
        // Load any existing documents from localStorage or server
        const savedDocuments = localStorage.getItem('documents');
        if (savedDocuments) {
            try {
                this.documents = JSON.parse(savedDocuments);
                this.renderDocuments();
            } catch (e) {
                console.error('Error loading documents:', e);
            }
        }
    }

    saveDocuments() {
        // Save documents to localStorage (in a real app, this would be server-side)
        try {
            const documentsToSave = this.documents.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                size: doc.size,
                uploadDate: doc.uploadDate
                // Note: We don't save the actual file object
            }));
            localStorage.setItem('documents', JSON.stringify(documentsToSave));
        } catch (e) {
            console.error('Error saving documents:', e);
        }
    }

    renderDocuments() {
        const grid = document.getElementById('documents-grid');
        if (!grid) return;

        grid.innerHTML = '';
        this.documents.forEach(doc => {
            const element = this.createDocumentElement(doc);
            grid.appendChild(element);
        });
    }

    showError(message) {
        console.error(message);
        // You could implement a toast notification system here
    }

    showSuccess(message) {
        console.log(message);
        // You could implement a toast notification system here
    }

    deleteDocument(documentId) {
        this.documents = this.documents.filter(doc => doc.id !== documentId);
        this.saveDocuments();
        this.renderDocuments();
    }

    searchDocuments(query) {
        if (!query) {
            this.renderDocuments();
            return;
        }

        const filteredDocuments = this.documents.filter(doc =>
            doc.name.toLowerCase().includes(query.toLowerCase())
        );

        const grid = document.getElementById('documents-grid');
        if (!grid) return;

        grid.innerHTML = '';
        filteredDocuments.forEach(doc => {
            const element = this.createDocumentElement(doc);
            grid.appendChild(element);
        });
    }
}

// Initialize document manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.documentManager = new DocumentManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentManager;
} 