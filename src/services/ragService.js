// src/services/ragService.js
import { constitutionKnowledgeService } from './constitutionKnowledgeService';
import { indianKanoonService } from './indianKanoonService';

class RagService {
  constructor() {
    this.index = [];
  }

  /**
   * Split document text into chunks
   * 500 characters with 50 characters overlap
   */
  chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    if (!text) return chunks;
    
    let i = 0;
    while (i < text.length) {
      const chunk = text.substring(i, i + chunkSize);
      chunks.push(chunk);
      i += (chunkSize - overlap);
    }
    return chunks;
  }

  /**
   * Simple tokenizer and term frequency calculation
   */
  tokenize(text) {
    const words = text.toLowerCase().match(/\b(\w+)\b/g) || [];
    const tf = {};
    words.forEach(word => {
      tf[word] = (tf[word] || 0) + 1;
    });
    return { tf, magnitude: Math.sqrt(Object.values(tf).reduce((sum, val) => sum + val * val, 0)) };
  }

  /**
   * Calculate cosine similarity between two tf vectors
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.magnitude === 0 || vec2.magnitude === 0) return 0;
    
    let dotProduct = 0;
    for (const term in vec1.tf) {
      if (vec2.tf[term]) {
        dotProduct += vec1.tf[term] * vec2.tf[term];
      }
    }
    return dotProduct / (vec1.magnitude * vec2.magnitude);
  }

  /**
   * Index a document by splitting into chunks and storing them
   */
  indexDocument(docId, title, textContent) {
    const chunks = this.chunkText(textContent);
    
    chunks.forEach((chunk, chunkIndex) => {
      this.index.push({
        docId,
        title,
        chunkIndex,
        text: chunk,
        vector: this.tokenize(chunk)
      });
    });
    
    console.log(`Indexed document ${docId} with ${chunks.length} chunks`);
  }

  /**
   * Sync and index documents stored in localStorage
   */
  syncVaultDocuments() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    this.clearIndex();
    
    // 1. Sync Uploaded Vault Documents
    try {
      const vaultDocsRaw = localStorage.getItem('lawbot-vault-docs');
      if (vaultDocsRaw) {
        const docs = JSON.parse(vaultDocsRaw);
        docs.forEach(doc => {
          let textContent = `Document Title: ${doc.title}\nCategory: ${doc.category || 'General'}\nStatus: ${doc.status || ''}\n`;
          if (doc.extractedData) {
            textContent += 'Extracted Metadata:\n' + Object.entries(doc.extractedData)
              .map(([key, val]) => `- ${key}: ${val}`)
              .join('\n');
          }
          if (doc.content) {
            textContent += `\nContent:\n${doc.content}`;
          }
          this.indexDocument(doc.id, doc.title, textContent);
        });
      }
    } catch (e) {
      console.error('Failed to sync vault docs for RAG:', e);
    }
    
    // 2. Sync Generated Documents
    try {
      const generatedDocsRaw = localStorage.getItem('lawbot-documents');
      if (generatedDocsRaw) {
        const docs = JSON.parse(generatedDocsRaw);
        docs.forEach(doc => {
          let textContent = `Document Title: ${doc.title}\nType: ${doc.type || 'General'}\nStatus: ${doc.status || ''}\n`;
          if (doc.content) {
            textContent += `\nContent:\n${doc.content}`;
          }
          this.indexDocument(doc.id, doc.title, textContent);
        });
      }
    } catch (e) {
      console.error('Failed to sync generated documents for RAG:', e);
    }
  }

  /**
   * Traverses Constitutional Knowledge Graph relationships (Articles, Parts, Connected Articles & Landmark Precedents)
   */
  queryConstitutionalGraphRag(query) {
    if (!query) return '';
    try {
      const matched = constitutionKnowledgeService.searchArticles(query, 3);
      if (!matched || matched.length === 0) return '';

      let out = '';
      matched.forEach(({ article }) => {
        out += `Primary Node: [Article ${article.ArtNo}: ${article.Name}] (Part ${article.PartNo}: ${article.PartName})\n`;
        out += `  Category: ${article.category || 'Constitutional Law'}\n`;
        if (article.landmark_cases && article.landmark_cases.length > 0) {
          out += `  Landmark Precedent Nodes: ${article.landmark_cases.join('; ')}\n`;
        }
        if (article.related_articles && article.related_articles.length > 0) {
          const relatedRefs = article.related_articles.slice(0, 5).map(rNo => {
            const rArt = constitutionKnowledgeService.getArticle(rNo);
            return rArt ? `Art ${rNo} (${rArt.Name.slice(0, 30)})` : `Art ${rNo}`;
          });
          out += `  Graph Cross-References (Edges): ${relatedRefs.join(' <-> ')}\n`;
        }
      });
      return out;
    } catch (e) {
      console.warn('Constitutional Graph RAG traversal error:', e);
      return '';
    }
  }

  /**
   * Simple Graph RAG query traversal based on user query keywords
   */
  queryGraphRag(query) {
    if (typeof window === 'undefined' || !window.localStorage) return '';
    if (!query) return '';
    
    const lowerQuery = query.toLowerCase();
    
    // Fetch latest data to build the graph
    let profile = null;
    let docs = [];
    try {
      const savedProfile = localStorage.getItem('lawbot-user-profile');
      if (savedProfile) profile = JSON.parse(savedProfile);
      
      const savedDocs = localStorage.getItem('lawbot-vault-docs') || localStorage.getItem('lawbot-documents');
      if (savedDocs) docs = JSON.parse(savedDocs);
    } catch (e) {
      console.error('Failed to fetch data for Graph RAG:', e);
      return '';
    }
    
    // 1. Build the in-memory Conceptual Graph nodes and edges
    const graph = {
      nodes: {},
      edges: []
    };
    
    if (profile) {
      graph.nodes['profile'] = {
        name: profile.entityName || 'Acme Business',
        type: 'profile',
        data: {
          structure: profile.businessType || 'N/A',
          industry: profile.industry || 'N/A',
          state: profile.state || 'N/A',
          turnover: profile.turnover || 'N/A',
          employeeCount: profile.employeeCount || 'N/A',
          registrations: profile.registrations ? Object.entries(profile.registrations).filter(([_, v]) => v).map(([k]) => k.toUpperCase()) : []
        }
      };
    }
    
    if (docs.length > 0) {
      graph.nodes['vault'] = {
        name: `Secure Document Vault (${docs.length} files)`,
        type: 'vault',
        data: docs.map(d => ({ title: d.title, category: d.category, status: d.status }))
      };
      graph.edges.push({ source: 'profile', target: 'vault', relation: 'stores_documents' });
    }
    
    const activeLicenses = [];
    if (profile?.registrations) {
      if (profile.registrations.gst) activeLicenses.push('GSTIN Registration');
      if (profile.registrations.pan) activeLicenses.push('Corporate PAN Card');
      if (profile.registrations.msme) activeLicenses.push('Udyam MSME Registration');
      if (profile.registrations.shopAct) activeLicenses.push('Shop & Establishment License');
      if (profile.registrations.fssai) activeLicenses.push('FSSAI License');
      if (profile.registrations.pfEsi) activeLicenses.push('EPFO / ESIC Registration');
    }
    if (activeLicenses.length > 0) {
      graph.nodes['licenses'] = {
        name: `Registered Licenses (${activeLicenses.length})`,
        type: 'licenses',
        data: activeLicenses
      };
      graph.edges.push({ source: 'profile', target: 'licenses', relation: 'holds_licenses' });
      graph.edges.push({ source: 'vault', target: 'licenses', relation: 'verifies_licenses' });
    }
    
    // Compliance Deadlines (Derived from registrations)
    const complianceDeadlines = [
      { title: 'GSTR-1 Monthly Return', dueDate: '2026-08-11', category: 'GST', status: 'Due Soon' },
      { title: 'GSTR-3B Summary Return', dueDate: '2026-08-20', category: 'GST', status: 'Upcoming' },
      { title: 'EPFO & ESIC Deposit', dueDate: '2026-08-15', category: 'Labour Law', status: 'Due Soon' },
      { title: 'TDS Quarterly Return', dueDate: '2026-07-31', category: 'Income Tax', status: 'Overdue' }
    ];
    // Filter to relevant ones
    const filteredDeadlines = complianceDeadlines.filter(dl => {
      if (dl.category === 'GST' && !profile?.registrations?.gst) return false;
      if (dl.category === 'Labour Law' && !profile?.registrations?.pfEsi) return false;
      if (dl.category === 'Income Tax' && !profile?.registrations?.pan) return false;
      return true;
    });
    
    if (filteredDeadlines.length > 0) {
      graph.nodes['compliance'] = {
        name: `Compliance Deadlines (${filteredDeadlines.length})`,
        type: 'compliance',
        data: filteredDeadlines
      };
      if (graph.nodes['licenses']) {
        graph.edges.push({ source: 'licenses', target: 'compliance', relation: 'triggers_deadlines' });
      }
    }
    
    // Eligible Schemes
    const eligibleSchemes = [];
    if (profile) {
      const isMicro = profile.businessType === 'proprietorship' || profile.businessType === 'individual';
      const isPvtLtd = profile.businessType === 'pvt_ltd' || profile.businessType === 'llp';
      
      if (isMicro || profile.employeeCount <= 10) {
        eligibleSchemes.push({ title: 'Mudra Yojana Loan', benefit: 'Low-interest loans up to ₹10L' });
      }
      if (isPvtLtd || (profile.industry && (profile.industry.includes('Software') || profile.industry.includes('IT')))) {
        eligibleSchemes.push({ title: 'Startup India Support', benefit: '80% tax exemption & fund access' });
      }
      eligibleSchemes.push({ title: 'PMEGP Credit Linked Subsidy', benefit: '30% margin subsidy for new projects' });
    }
    
    if (eligibleSchemes.length > 0) {
      graph.nodes['schemes'] = {
        name: `Eligible Schemes (${eligibleSchemes.length})`,
        type: 'schemes',
        data: eligibleSchemes
      };
      graph.edges.push({ source: 'profile', target: 'schemes', relation: 'qualifies_for' });
    }
    
    // 2. Perform graph search / focus node extraction
    const activatedNodes = new Set();
    
    if (lowerQuery.includes('tax') || lowerQuery.includes('gst') || lowerQuery.includes('filing') || lowerQuery.includes('deadline') || lowerQuery.includes('pay') || lowerQuery.includes('due') || lowerQuery.includes('return')) {
      if (graph.nodes['compliance']) activatedNodes.add('compliance');
      if (graph.nodes['licenses']) activatedNodes.add('licenses');
    }
    if (lowerQuery.includes('scheme') || lowerQuery.includes('benefit') || lowerQuery.includes('subsidy') || lowerQuery.includes('yojana') || lowerQuery.includes('mudra') || lowerQuery.includes('startup') || lowerQuery.includes('support')) {
      if (graph.nodes['schemes']) activatedNodes.add('schemes');
    }
    if (lowerQuery.includes('document') || lowerQuery.includes('vault') || lowerQuery.includes('contract') || lowerQuery.includes('nda') || lowerQuery.includes('agreement') || lowerQuery.includes('policy')) {
      if (graph.nodes['vault']) activatedNodes.add('vault');
    }
    
    // If no nodes activated, default to profile
    if (activatedNodes.size === 0 && graph.nodes['profile']) {
      activatedNodes.add('profile');
    }
    
    // 3. Traverse the neighbors of activated nodes (1-hop expansion)
    const contextNodes = new Set(activatedNodes);
    activatedNodes.forEach(nodeId => {
      graph.edges.forEach(edge => {
        if (edge.source === nodeId) contextNodes.add(edge.target);
        if (edge.target === nodeId) contextNodes.add(edge.source);
      });
    });
    
    // 4. Format the final Graph RAG prompt context
    let graphContext = "Knowledge Graph Context (Nodes & Relations):\n";
    contextNodes.forEach(nodeId => {
      const node = graph.nodes[nodeId];
      if (!node) return;
      graphContext += `Node: [${node.name}] (Type: ${node.type})\n`;
      graphContext += `  Details: ${JSON.stringify(node.data)}\n`;
    });
    
    // Add relevant relations
    const traversedEdges = graph.edges.filter(e => contextNodes.has(e.source) && contextNodes.has(e.target));
    if (traversedEdges.length > 0) {
      graphContext += `Relationships:\n`;
      traversedEdges.forEach(e => {
        graphContext += `  - [${graph.nodes[e.source]?.name}] --(${e.relation})--> [${graph.nodes[e.target]?.name}]\n`;
      });
    }
    
    return graphContext;
  }

  /**
   * Search for relevant chunks based on query
   */
  searchRelevantChunks(query, topK = 3) {
    this.syncVaultDocuments(); // Ensure index is populated before search
    
    const queryVector = this.tokenize(query);
    
    const results = this.index.map(item => ({
      ...item,
      score: this.cosineSimilarity(queryVector, item.vector)
    }));
    
    // Sort by score descending and take topK
    // Filter out 0 score results
    const filteredResults = results.filter(r => r.score > 0);
    filteredResults.sort((a, b) => b.score - a.score);
    return filteredResults.slice(0, topK);
  }

  /**
   * Complete multi-source RAG retrieval pipeline:
   * 1. Constitution of India verified statutory articles
   * 2. Indian Kanoon official case law precedents & citations
   * 3. Local Vault documents & business policy contracts
   * 4. Graph RAG business ecosystem
   */
  async buildCompleteRagContext(query) {
    if (!query) return { contextPrompt: '', sources: [] };

    const sources = [];
    let ragSections = [];

    // 1. Retrieve Constitution of India context
    try {
      const constitutionContext = constitutionKnowledgeService.generateConstitutionRagContext(query);
      if (constitutionContext) {
        ragSections.push(constitutionContext);
        const matchedArticles = constitutionKnowledgeService.searchArticles(query, 3);
        matchedArticles.forEach(m => {
          sources.push({
            type: 'Constitution of India',
            title: `Article ${m.article.ArtNo}: ${m.article.Name}`,
            category: m.article.category || 'Statute'
          });
        });
      }
    } catch (e) {
      console.warn('Constitution RAG lookup failed:', e);
    }

    // 2. Retrieve Live Indian Kanoon case precedents & statutes
    try {
      const kanoonContext = await indianKanoonService.generateKanoonRagContext(query);
      if (kanoonContext) {
        ragSections.push(kanoonContext);
        const kanoonDocs = await indianKanoonService.queryLegalPrecedents(query, 2);
        kanoonDocs.forEach(d => {
          sources.push({
            type: 'Indian Kanoon Citation',
            title: d.title,
            url: d.url
          });
        });
      }
    } catch (e) {
      console.warn('Indian Kanoon RAG lookup failed:', e);
    }

    // 3. Retrieve Local Vault document chunks
    try {
      const relevantChunks = this.searchRelevantChunks(query, 3);
      if (relevantChunks && relevantChunks.length > 0) {
        const vaultText = relevantChunks.map(c => `[Doc: ${c.title}]\n${c.text}`).join('\n\n');
        ragSections.push(`=== SECURE VAULT & CONTRACT DOCUMENTS ===\n${vaultText}\n=== END OF VAULT DOCUMENTS ===`);
        relevantChunks.forEach(c => {
          sources.push({
            type: 'Vault Document',
            title: c.title
          });
        });
      }
    } catch (e) {
      console.warn('Vault RAG lookup failed:', e);
    }

    // 4. Retrieve Constitutional & Business Graph RAG Context
    try {
      const constitutionGraphContext = this.queryConstitutionalGraphRag(query);
      if (constitutionGraphContext) {
        ragSections.push(`=== CONSTITUTIONAL KNOWLEDGE GRAPH RELATIONS (GRAPH RAG) ===\n${constitutionGraphContext}\n=== END OF CONSTITUTIONAL GRAPH ===`);
      }

      const graphContext = this.queryGraphRag(query);
      if (graphContext) {
        ragSections.push(`=== BUSINESS & COMPLIANCE GRAPH ECOSYSTEM ===\n${graphContext}\n=== END OF GRAPH ECOSYSTEM ===`);
      }
    } catch (e) {
      console.warn('Graph RAG lookup failed:', e);
    }

    // Construct final strict grounding prompt
    let contextPrompt = '';
    if (ragSections.length > 0) {
      contextPrompt = `
[STRICT GROUNDING & ANTI-HALLUCINATION INSTRUCTIONS]
You are equipped with verified legal sources below (Constitution of India & Indian Kanoon citations).
CRITICAL RULES:
1. Always prioritize and cite the exact Article number from the Constitution of India where applicable.
2. Quote relevant statutory clauses accurately without inventing provisions or numbers.
3. If citing case law or precedents, cite the verified Indian Kanoon reference provided below.
4. If a question is outside the scope of known Indian statutes, state that clearly and advise consulting a practicing advocate.
5. NEVER fabricate nonexistent legal sections or court rulings.

${ragSections.join('\n\n')}
`;
    }

    return {
      contextPrompt,
      sources,
      hasConstitution: sources.some(s => s.type === 'Constitution of India'),
      hasKanoon: sources.some(s => s.type === 'Indian Kanoon Citation'),
      hasVault: sources.some(s => s.type === 'Vault Document')
    };
  }

  /**
   * Clear the index
   */
  clearIndex() {
    this.index = [];
  }
}

export const ragService = new RagService();
export default ragService;
