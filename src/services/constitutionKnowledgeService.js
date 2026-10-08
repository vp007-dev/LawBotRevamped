// src/services/constitutionKnowledgeService.js
import constitutionData from '../data/constitutionOfIndia.json';

class ConstitutionKnowledgeService {
  constructor() {
    this.articles = [];
    this.parts = [];
    this.articleMap = new Map();
    this.graphCache = null;
    this.init();
  }

  init() {
    if (Array.isArray(constitutionData) && constitutionData.length >= 2) {
      this.articles = constitutionData[0] || [];
      this.parts = constitutionData[1] || [];
    } else if (Array.isArray(constitutionData)) {
      this.articles = constitutionData;
    }

    // Index articles by article number (e.g. "0", "1", "21", "21A", "300A")
    this.articles.forEach(art => {
      if (art && art.ArtNo !== undefined) {
        const cleanNo = String(art.ArtNo).toUpperCase().replace(/[\.\s]+/g, '');
        this.articleMap.set(cleanNo, art);
        this.articleMap.set(`ARTICLE ${cleanNo}`, art);
        this.articleMap.set(`ART ${cleanNo}`, art);
      }
    });

    console.log(`ConstitutionKnowledgeService initialized: ${this.articles.length} articles across ${this.parts.length} parts indexed.`);
  }

  /**
   * Get all articles
   */
  getAllArticles() {
    return this.articles;
  }

  /**
   * Get all parts
   */
  getAllParts() {
    return this.parts;
  }

  /**
   * Look up article by number (e.g. "21", "21A", "14", "19", "0" for Preamble, "300A")
   */
  getArticle(artNo) {
    if (!artNo) return null;
    const cleanNo = String(artNo).trim().replace(/^article\s+/i, '').replace(/^art\s+/i, '').replace(/[\.\s]+/g, '').toUpperCase();
    return this.articleMap.get(cleanNo) || null;
  }

  /**
   * Get articles belonging to a specific Part (e.g. "I", "II", "III", "IV")
   */
  getArticlesByPart(partNo) {
    const cleanPart = String(partNo).trim().toUpperCase();
    return this.articles.filter(a => String(a.PartNo || '').toUpperCase() === cleanPart);
  }

  /**
   * Format an article's full legal content into plain readable markdown
   */
  formatArticleText(art) {
    if (!art) return '';

    let out = `### Article ${art.ArtNo}: ${art.Name}\n`;
    if (art.PartName) {
      out += `*Part ${art.PartNo}: ${art.PartName}*\n`;
    }
    if (art.category) {
      out += `**Category:** ${art.category}\n`;
    }

    if (art.ArtDesc) {
      out += `\n${art.ArtDesc}\n\n`;
    }

    if (Array.isArray(art.landmark_cases) && art.landmark_cases.length > 0) {
      out += `**Landmark Judicial Precedents:**\n`;
      art.landmark_cases.forEach(c => {
        out += `- ${c}\n`;
      });
      out += '\n';
    }

    if (Array.isArray(art.related_articles) && art.related_articles.length > 0) {
      out += `**Interconnected Constitutional Articles:** Article ${art.related_articles.join(', Article ')}\n`;
    }

    return out.trim();
  }

  /**
   * Search for articles matching query keywords with synonym and domain boosts
   */
  searchArticles(query, maxResults = 4) {
    if (!query || typeof query !== 'string') return [];

    const lowerQuery = query.toLowerCase();

    // 1. Direct Article Number match check (e.g. "article 21", "art 14", "article 300a")
    const artMatch = lowerQuery.match(/\b(?:article|art\.?)\s*([0-9]+[a-z]?)\b/i);
    if (artMatch && artMatch[1]) {
      const directArt = this.getArticle(artMatch[1]);
      if (directArt) {
        return [{
          article: directArt,
          score: 100,
          formattedText: this.formatArticleText(directArt)
        }];
      }
    }

    // 2. Keyword & Concept match scoring
    const searchTerms = lowerQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (searchTerms.length === 0) return [];

    const scored = this.articles.map(art => {
      let score = 0;
      const fullText = (
        `${art.ArtNo} ${art.Name || ''} ${art.category || ''} ${art.ArtDesc || ''} ` +
        (art.keywords || []).join(' ') + ' ' +
        (art.landmark_cases || []).join(' ')
      ).toLowerCase();

      // Priority boost for Fundamental Rights (Part III)
      if (art.PartNo === 'III') score += 3;
      if (art.importance === 'fundamental') score += 6;
      if (art.importance === 'high') score += 3;

      // Exact article number mention in query
      if (lowerQuery.includes(`article ${art.ArtNo.toLowerCase()}`) || lowerQuery.includes(`art ${art.ArtNo.toLowerCase()}`)) {
        score += 60;
      }

      // Check title matches
      if (art.Name && art.Name.toLowerCase().includes(lowerQuery)) {
        score += 35;
      }

      // Check search terms
      searchTerms.forEach(term => {
        if (art.Name && art.Name.toLowerCase().includes(term)) {
          score += 15;
        }
        if (art.category && art.category.toLowerCase().includes(term)) {
          score += 10;
        }
        if (art.keywords && art.keywords.some(k => k.includes(term))) {
          score += 8;
        }
        if (art.ArtDesc && art.ArtDesc.toLowerCase().includes(term)) {
          score += 6;
        }
        const matches = (fullText.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
        score += Math.min(matches * 2, 12);
      });

      // Domain-specific synonym mappings
      if ((lowerQuery.includes('speech') || lowerQuery.includes('expression') || lowerQuery.includes('press') || lowerQuery.includes('media') || lowerQuery.includes('censorship')) && art.ArtNo === '19') score += 30;
      if ((lowerQuery.includes('life') || lowerQuery.includes('liberty') || lowerQuery.includes('privacy') || lowerQuery.includes('phone') || lowerQuery.includes('surveillance') || lowerQuery.includes('dignity')) && art.ArtNo === '21') score += 35;
      if ((lowerQuery.includes('arrest') || lowerQuery.includes('custody') || lowerQuery.includes('detention') || lowerQuery.includes('police')) && (art.ArtNo === '21' || art.ArtNo === '22')) score += 30;
      if ((lowerQuery.includes('equality') || lowerQuery.includes('equal') || lowerQuery.includes('discrimination') || lowerQuery.includes('caste') || lowerQuery.includes('gender')) && (art.ArtNo === '14' || art.ArtNo === '15')) score += 30;
      if ((lowerQuery.includes('reservation') || lowerQuery.includes('quota') || lowerQuery.includes('ews') || lowerQuery.includes('job') || lowerQuery.includes('employment')) && (art.ArtNo === '16' || art.ArtNo === '15' || art.ArtNo === '335')) score += 30;
      if ((lowerQuery.includes('writ') || lowerQuery.includes('habeas corpus') || lowerQuery.includes('mandamus') || lowerQuery.includes('certiorari') || lowerQuery.includes('remedy')) && (art.ArtNo === '32' || art.ArtNo === '226')) score += 35;
      if ((lowerQuery.includes('property') || lowerQuery.includes('land') || lowerQuery.includes('compensation') || lowerQuery.includes('deprived of property')) && (art.ArtNo === '300A' || art.ArtNo === '31A')) score += 35;
      if ((lowerQuery.includes('religion') || lowerQuery.includes('worship') || lowerQuery.includes('faith') || lowerQuery.includes('kirpan') || lowerQuery.includes('conversion')) && (art.ArtNo === '25' || art.ArtNo === '26')) score += 30;
      if ((lowerQuery.includes('education') || lowerQuery.includes('school') || lowerQuery.includes('children')) && (art.ArtNo === '21A' || art.ArtNo === '45')) score += 30;
      if ((lowerQuery.includes('untouchability') || lowerQuery.includes('dalit') || lowerQuery.includes('sc/st')) && (art.ArtNo === '17' || art.ArtNo === '15')) score += 35;
      if ((lowerQuery.includes('citizen') || lowerQuery.includes('citizenship') || lowerQuery.includes('passport') || lowerQuery.includes('nri') || lowerQuery.includes('domicile')) && ['5', '6', '7', '8', '9', '10', '11'].includes(art.ArtNo)) score += 25;
      if ((lowerQuery.includes('supreme court') || lowerQuery.includes('chief justice') || lowerQuery.includes('special leave') || lowerQuery.includes('slp') || lowerQuery.includes('curative')) && (art.ArtNo === '124' || art.ArtNo === '136' || art.ArtNo === '141' || art.ArtNo === '142')) score += 35;
      if ((lowerQuery.includes('high court') || lowerQuery.includes('quash') || lowerQuery.includes('stay order')) && (art.ArtNo === '226' || art.ArtNo === '227' || art.ArtNo === '214')) score += 35;
      if ((lowerQuery.includes('amendment') || lowerQuery.includes('amend') || lowerQuery.includes('basic structure')) && (art.ArtNo === '368' || art.ArtNo === '13')) score += 35;
      if ((lowerQuery.includes('emergency') || lowerQuery.includes('president rule') || lowerQuery.includes('governor report')) && (art.ArtNo === '352' || art.ArtNo === '356' || art.ArtNo === '358' || art.ArtNo === '359')) score += 35;
      if ((lowerQuery.includes('legal aid') || lowerQuery.includes('free lawyer') || lowerQuery.includes('speedy trial')) && art.ArtNo === '39A') score += 35;
      if ((lowerQuery.includes('uniform civil code') || lowerQuery.includes('ucc')) && art.ArtNo === '44') score += 40;
      if ((lowerQuery.includes('environment') || lowerQuery.includes('pollution') || lowerQuery.includes('forest') || lowerQuery.includes('wildlife')) && (art.ArtNo === '48A' || art.ArtNo === '51A' || art.ArtNo === '21')) score += 30;
      if ((lowerQuery.includes('ordinance')) && (art.ArtNo === '123' || art.ArtNo === '213')) score += 35;
      if ((lowerQuery.includes('tax') || lowerQuery.includes('gst') || lowerQuery.includes('consolidated fund')) && (art.ArtNo === '265' || art.ArtNo === '246' || art.ArtNo === '266')) score += 30;

      return {
        article: art,
        score,
        formattedText: this.formatArticleText(art)
      };
    });

    const results = scored.filter(item => item.score > 0);
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  /**
   * Generates RAG Context specifically grounding constitutional provisions
   */
  generateConstitutionRagContext(query) {
    const matched = this.searchArticles(query, 4);
    if (!matched || matched.length === 0) return '';

    let context = `=== OFFICIAL CONSTITUTION OF INDIA KNOWLEDGE BASE (PRIMARY STATUTORY SOURCE) ===\n`;
    context += `The following articles are authoritative statutory law from the Constitution of India. You must rely on them verbatim and cite exact Article numbers:\n\n`;

    matched.forEach((item, idx) => {
      context += `[CONSTITUTION SOURCE #${idx + 1} - Article ${item.article.ArtNo}]\n`;
      context += `${item.formattedText}\n\n`;
    });

    context += `=== END OF CONSTITUTION OF INDIA KNOWLEDGE BASE ===\n`;
    return context;
  }

  /**
   * Generate Obsidian-style Knowledge Graph dataset
   * Nodes and links structured for force simulation and interactive visualization
   */
  getGraphData() {
    if (this.graphCache) return this.graphCache;

    const nodes = [];
    const edges = [];
    const nodeSet = new Set();

    // 1. Category color palettes (Obsidian Style)
    const categoryColors = {
      'Preamble': '#f59e0b',
      'Right to Equality': '#8b5cf6',
      'Right to Freedom & Personal Liberty': '#ec4899',
      'Right against Exploitation': '#f43f5e',
      'Freedom of Religion': '#10b981',
      'Cultural and Educational Rights': '#06b6d4',
      'Constitutional Remedies & Writs': '#3b82f6',
      'Directive Principles of State Policy': '#10b981',
      'Fundamental Duties': '#059669',
      'The President of India': '#eab308',
      'Parliament & Union Legislature': '#f59e0b',
      'Supreme Court of India': '#38bdf8',
      'High Courts in States': '#60a5fa',
      'The Governor & State Executive': '#fb923c',
      'Union-State Legislative Powers': '#a855f7',
      'Finance, Taxes & Consolidated Fund': '#14b8a6',
      'Right to Property': '#06b6d4',
      'Emergency Provisions': '#ef4444',
      'Constitutional Amendment (Basic Structure)': '#c084fc',
      'Local Self-Government (Panchayats & Municipalities)': '#34d399',
      'default': '#94a3b8'
    };

    // Helper to add node
    const addNode = (n) => {
      if (!nodeSet.has(n.id)) {
        nodeSet.add(n.id);
        nodes.push(n);
      }
    };

    // Helper to add edge
    const addEdge = (source, target, relation = 'connected_to') => {
      if (source !== target) {
        edges.push({
          id: `${source}->${target}`,
          source,
          target,
          relation
        });
      }
    };

    // 2. Add Key Constitutional Articles to the Graph
    this.articles.forEach(art => {
      const artId = `art-${art.ArtNo}`;
      const color = categoryColors[art.category] || categoryColors['default'];
      const isHub = art.importance === 'fundamental';
      const isHigh = art.importance === 'high';

      addNode({
        id: artId,
        label: `Art ${art.ArtNo}`,
        fullTitle: `Article ${art.ArtNo}: ${art.Name}`,
        artNo: art.ArtNo,
        type: 'article',
        partNo: art.PartNo,
        partName: art.PartName,
        category: art.category,
        color,
        radius: isHub ? 14 : (isHigh ? 9 : 6),
        importance: art.importance,
        desc: art.ArtDesc,
        landmarkCases: art.landmark_cases || [],
        relatedArticles: art.related_articles || []
      });

      // Connect article to related articles
      if (Array.isArray(art.related_articles)) {
        art.related_articles.forEach(relArtNo => {
          const targetId = `art-${relArtNo}`;
          addEdge(artId, targetId, 'cross_references');
        });
      }

      // Add landmark case nodes for major hub articles
      if (isHub || isHigh) {
        (art.landmark_cases || []).slice(0, 2).forEach(cName => {
          const caseId = `case-${cName.replace(/[^\w]/g, '_').toLowerCase()}`;
          addNode({
            id: caseId,
            label: cName.split('(')[0].trim().slice(0, 22) + '...',
            fullTitle: cName,
            type: 'case',
            color: '#fbbf24',
            radius: 5,
            parentArticle: art.ArtNo
          });
          addEdge(artId, caseId, 'judicial_precedent');
        });
      }
    });

    this.graphCache = { nodes, edges };
    return this.graphCache;
  }
}

export const constitutionKnowledgeService = new ConstitutionKnowledgeService();
export default constitutionKnowledgeService;
