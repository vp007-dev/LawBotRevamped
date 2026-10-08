// Document Service for LawBot360 - Save and manage generated documents
class DocumentService {
  constructor() {
    this.storageKey = 'lawbot-documents';
  }

  // Save document to local storage
  saveDocument(documentData) {
    try {
      const documents = this.getDocuments();
      const newDocument = {
        id: Date.now(),
        title: documentData.title || `${documentData.type.toUpperCase()} Document`,
        type: documentData.type,
        content: documentData.content,
        createdAt: new Date().toISOString(),
        status: 'generated'
      };
      
      documents.unshift(newDocument);
      localStorage.setItem(this.storageKey, JSON.stringify(documents));
      
      return newDocument;
    } catch (error) {
      console.error('Error saving document:', error);
      return null;
    }
  }

  // Get all saved documents
  getDocuments() {
    try {
      const documents = localStorage.getItem(this.storageKey);
      return documents ? JSON.parse(documents) : [];
    } catch (error) {
      console.error('Error loading documents:', error);
      return [];
    }
  }

  // Delete document
  deleteDocument(documentId) {
    try {
      const documents = this.getDocuments();
      const filteredDocuments = documents.filter(doc => doc.id !== documentId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredDocuments));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
}

export const documentService = new DocumentService();
export default documentService;