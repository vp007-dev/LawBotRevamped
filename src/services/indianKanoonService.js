// src/services/indianKanoonService.js
// Official Indian Kanoon API integration for statutory sections, case precedents & Supreme Court/High Court citations

class IndianKanoonService {
  constructor() {
    this.apiKey = import.meta.env.VITE_INDIAN_KANOON_API_KEY || '9d5c21ccb9b28f34586178b635e226e575766649';
    this.cache = new Map();
    // In browser, try Vite proxy first (/api/kanoon), then backend (/api/v1/kanoon), then direct
    this.proxyBaseUrl = '/api/kanoon';
    this.backendBaseUrl = 'http://localhost:8000/api/v1/kanoon';
    this.directBaseUrl = 'https://api.indiankanoon.org';
  }

  /**
   * Helper to clean HTML formatting from Kanoon titles and snippets
   */
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Search Indian Kanoon database for laws, sections, court rulings
   * @param {string} query - Legal query or section name (e.g., "Article 21 Constitution", "Section 138 NI Act")
   * @param {number} pagenum - Page number (default 0)
   */
  async search(query, pagenum = 0) {
    if (!query || typeof query !== 'string') return [];

    const cacheKey = `search:${query.toLowerCase()}:${pagenum}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const endpoints = [
      `${this.proxyBaseUrl}/search/`,
      `${this.backendBaseUrl}/search`,
      `${this.directBaseUrl}/search/`
    ];

    const bodyParams = new URLSearchParams();
    bodyParams.append('formInput', query.trim());
    bodyParams.append('pagenum', String(pagenum));

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: bodyParams.toString()
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const docs = Array.isArray(data.docs) ? data.docs : [];

        const sanitized = docs.map(doc => ({
          tid: doc.tid,
          title: this.stripHtml(doc.title),
          headline: this.stripHtml(doc.headline),
          docsource: doc.docsource || 'Court / Statute',
          publishdate: doc.publishdate || '',
          numcites: doc.numcites || 0,
          numcitedby: doc.numcitedby || 0,
          url: `https://indiankanoon.org/doc/${doc.tid}/`
        }));

        this.cache.set(cacheKey, sanitized);
        return sanitized;
      } catch (err) {
        // Continue to fallback endpoint
        console.warn(`Kanoon search attempt failed on ${endpoint}:`, err.message);
      }
    }

    return [];
  }

  /**
   * Fetch specific document content by TID
   * @param {number|string} tid - Kanoon Document TID
   */
  async getDoc(tid) {
    if (!tid) return null;

    const cacheKey = `doc:${tid}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const endpoints = [
      `${this.proxyBaseUrl}/doc/${tid}/`,
      `${this.backendBaseUrl}/doc/${tid}`,
      `${this.directBaseUrl}/doc/${tid}/`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (!response.ok) continue;

        const data = await response.json();
        const result = {
          tid: data.tid || tid,
          title: this.stripHtml(data.title),
          docsource: data.docsource || 'Court Record',
          publishdate: data.publishdate || '',
          content: this.stripHtml(data.doc || ''),
          url: `https://indiankanoon.org/doc/${tid}/`
        };

        this.cache.set(cacheKey, result);
        return result;
      } catch (err) {
        console.warn(`Kanoon doc fetch failed on ${endpoint}:`, err.message);
      }
    }

    return null;
  }

  /**
   * Automatically extract and query legal citations for RAG context
   * @param {string} query - User prompt / legal query
   * @param {number} maxDocs - Maximum precedents to return
   */
  async queryLegalPrecedents(query, maxDocs = 3) {
    if (!query) return [];

    // Formulate a high-precision Kanoon search term
    let searchTerm = query;

    // If query has constitution/article references, enhance search
    const artMatch = query.match(/(?:article|art\.?)\s*([0-9]+[a-z]?)/i);
    if (artMatch) {
      searchTerm = `Constitution of India Article ${artMatch[1]}`;
    }

    const results = await this.search(searchTerm, 0);
    return results.slice(0, maxDocs);
  }

  /**
   * Generates formatted RAG context from Indian Kanoon to anchor LLM responses
   * @param {string} query - The legal query
   */
  async generateKanoonRagContext(query) {
    try {
      const precedents = await this.queryLegalPrecedents(query, 3);
      if (!precedents || precedents.length === 0) return '';

      let context = `=== INDIAN KANOON STATUTORY PRECEDENTS & CITATIONS (LIVE CASE LAW) ===\n`;
      context += `These authoritative legal precedents are retrieved live from Indian Kanoon. Use them to cite exact cases, courts, and statutory provisions:\n\n`;

      precedents.forEach((item, idx) => {
        context += `[KANOON CITATION #${idx + 1}]\n`;
        context += `Title: ${item.title}\n`;
        context += `Forum / Source: ${item.docsource} (Date: ${item.publishdate || 'N/A'})\n`;
        if (item.headline) {
          context += `Key Statutory Extract / Ratio: ${item.headline}\n`;
        }
        context += `Verification Link: ${item.url}\n\n`;
      });

      context += `=== END OF INDIAN KANOON PRECEDENTS ===\n`;
      return context;
    } catch (e) {
      console.warn('Failed to build Indian Kanoon RAG context:', e);
      return '';
    }
  }
}

export const indianKanoonService = new IndianKanoonService();
export default indianKanoonService;
