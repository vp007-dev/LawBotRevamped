// Contract Analysis Service for LawBot360 - Updated
import lawBot360AI from './aiService';

class ContractAnalysisService {
  constructor() {
    this.storageKey = 'lawbot-contracts';
    console.log('ContractAnalysisService initialized - v2.0');
  }

  // Browser-compatible PDF text extraction using PDF.js CDN
  async extractTextFromPDF(file) {
    try {
      // Load PDF.js from CDN
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // Set worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText) {
          fullText += pageText + '\n';
        }
      }

      console.log('PDF extraction completed. Text length:', fullText.length);
      console.log('Sample text:', fullText.substring(0, 200));

      if (fullText.length > 50) {
        return fullText.trim();
      }

      // Fallback to OCR if no text found
      console.log('No text found in PDF, attempting OCR...');
      return await this.performOCR(file);

    } catch (error) {
      console.error('PDF extraction error:', error);
      // Fallback to OCR
      try {
        return await this.performOCR(file);
      } catch (ocrError) {
        throw new Error('Failed to extract text from PDF. Please ensure the file is not corrupted.');
      }
    }
  }

  // Extract text from Word documents
  async extractTextFromWord(file) {
    try {
      // Simple approach: try to read as text
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Extract readable text from Word binary
      let text = '';
      for (let i = 0; i < uint8Array.length; i++) {
        const char = String.fromCharCode(uint8Array[i]);
        if (char.match(/[a-zA-Z0-9\s.,;:!?()\[\]{}"'\-\/]/)) {
          text += char;
        }
      }

      // Clean up extracted text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,;:!?()\[\]{}"'\-\/]/g, '')
        .trim();

      console.log('Word extraction result length:', text.length);

      if (text.length > 50) {
        return text;
      }

      throw new Error('Could not extract readable text from Word document');
    } catch (error) {
      console.error('Word extraction error:', error);
      throw new Error('Failed to extract text from Word document. Please try converting to text format first.');
    }
  }

  // Extract text from Excel files
  async extractTextFromExcel(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Extract readable text from Excel binary
      let text = '';
      for (let i = 0; i < uint8Array.length; i++) {
        const char = String.fromCharCode(uint8Array[i]);
        if (char.match(/[a-zA-Z0-9\s.,;:!?()\[\]{}"'\-\/]/)) {
          text += char;
        }
      }

      // Clean up extracted text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,;:!?()\[\]{}"'\-\/]/g, '')
        .trim();

      console.log('Excel extraction result length:', text.length);

      if (text.length > 50) {
        return text;
      }

      throw new Error('Could not extract readable text from Excel file');
    } catch (error) {
      console.error('Excel extraction error:', error);
      throw new Error('Failed to extract text from Excel file. Please convert to text format first.');
    }
  }

  // Extract text from PowerPoint files
  async extractTextFromPowerPoint(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Extract readable text from PowerPoint binary
      let text = '';
      for (let i = 0; i < uint8Array.length; i++) {
        const char = String.fromCharCode(uint8Array[i]);
        if (char.match(/[a-zA-Z0-9\s.,;:!?()\[\]{}"'\-\/]/)) {
          text += char;
        }
      }

      // Clean up extracted text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,;:!?()\[\]{}"'\-\/]/g, '')
        .trim();

      console.log('PowerPoint extraction result length:', text.length);

      if (text.length > 50) {
        return text;
      }

      throw new Error('Could not extract readable text from PowerPoint file');
    } catch (error) {
      console.error('PowerPoint extraction error:', error);
      throw new Error('Failed to extract text from PowerPoint file. Please convert to text format first.');
    }
  }

  // Generic binary text extraction for unknown file types
  async extractTextFromBinary(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Extract readable text from any binary file
      let text = '';
      for (let i = 0; i < uint8Array.length; i++) {
        const char = String.fromCharCode(uint8Array[i]);
        if (char.match(/[a-zA-Z0-9\s.,;:!?()\[\]{}"'\-\/]/)) {
          text += char;
        }
      }

      // Clean up extracted text
      text = text
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,;:!?()\[\]{}"'\-\/]/g, '')
        .trim();

      console.log('Binary extraction result length:', text.length);

      if (text.length > 50) {
        return text;
      }

      throw new Error('Could not extract readable text from file');
    } catch (error) {
      console.error('Binary extraction error:', error);
      throw new Error('Failed to extract text from file. Please try converting to text format first.');
    }
  }
  // Browser-compatible OCR using Tesseract.js CDN
  async performOCR(file) {
    try {
      // Load Tesseract.js from CDN
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      console.log('Starting OCR processing...');

      const worker = await window.Tesseract.createWorker({
        logger: m => console.log('OCR Progress:', m)
      });

      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('OCR completed, extracted text length:', text.length);

      if (text.length < 50) {
        throw new Error('OCR extracted insufficient text');
      }

      return text;
    } catch (error) {
      console.error('OCR error:', error);
      throw new Error('Failed to perform OCR on document. Please ensure the image is clear and contains readable text.');
    }
  }

  // Main contract analysis function
  async analyzeContract(file) {
    try {
      let extractedText = '';
      const fileType = file.type;

      console.log('Processing file:', file.name, 'Type:', fileType);

      // Extract text based on file type with enhanced support
      if (fileType === 'application/pdf') {
        console.log('Processing PDF document...');
        extractedText = await this.extractTextFromPDF(file);
      } else if (fileType.includes('word') || fileType.includes('document') || fileType.includes('officedocument')) {
        console.log('Processing Word document...');
        extractedText = await this.extractTextFromWord(file);
      } else if (fileType.startsWith('image/')) {
        console.log('Processing image with OCR...');
        extractedText = await this.performOCR(file);
      } else if (fileType === 'text/plain' || fileType === 'text/csv' || fileType === 'application/rtf') {
        console.log('Processing text file...');
        extractedText = await file.text();
      } else if (fileType === 'application/vnd.ms-excel' || fileType.includes('spreadsheet')) {
        console.log('Processing Excel file...');
        extractedText = await this.extractTextFromExcel(file);
      } else if (fileType === 'application/vnd.ms-powerpoint' || fileType.includes('presentation')) {
        console.log('Processing PowerPoint file...');
        extractedText = await this.extractTextFromPowerPoint(file);
      } else {
        console.log('Processing unknown file type, attempting text extraction...');
        try {
          extractedText = await file.text();
        } catch {
          extractedText = await this.extractTextFromBinary(file);
        }
      }

      console.log('Extracted text length:', extractedText.length);

      // Fallback: if extraction failed or text is too short, use filename + basic analysis
      if (!extractedText || extractedText.length < 50) {
        extractedText = `Contract document: ${file.name}. Please provide contract details for analysis. The document may be empty, corrupted, or in an unsupported format.`;
      }

      // Enhanced AI Analysis with structured data extraction
      const analysisPrompt = `Analyze this contract document comprehensively:

${extractedText}

Provide a STRUCTURED legal analysis in the following format:

## EXECUTIVE SUMMARY
[One paragraph plain-language overview of the contract and overall assessment]

## KEY CLAUSES
For each major clause, provide:
- **Clause Name**: [e.g., Termination, Payment Terms, IP Rights, Liability, etc.]
- **Summary**: [Brief description]
- **Risk Level**: [Low/Medium/High]
- **Details**: [Full explanation]

## HIDDEN RISKS
List non-obvious risks:
- **Risk**: [Description of the hidden risk]
- **Severity**: [Critical/High/Medium/Low]
- **Impact**: [What could go wrong]
- **Recommendation**: [How to address it]

## UNFAIR OR ILLEGAL TERMS
Identify problematic provisions:
- **Term**: [Description of the unfair/illegal clause]
- **Legal Issue**: [Why it's problematic under Indian law]
- **Applicable Law**: [Specific Act and Section]
- **Enforceability**: [Likely enforceable/questionable/void]
- **Alternative**: [Suggested fair alternative]

## COMPLIANCE ASSESSMENT
Rate compliance (0-100) in these areas:
- Indian Contract Act 1872: [score]/100
- Consumer Protection: [score]/100
- Employment Law: [score]/100
- Data Protection: [score]/100
- Overall Fairness: [score]/100

## RECOMMENDATIONS
[Numbered list of specific actions to take]

Be thorough and reference specific Indian legal provisions where applicable.`;

      const aiResponse = await lawBot360AI.sendMessage(analysisPrompt);

      // Only continue with an actual provider response. A failed provider response
      // previously flowed into the parser and produced an invalid contract report.
      const analysisText = typeof aiResponse === 'string' ? aiResponse : aiResponse?.response;
      if (!aiResponse?.success || typeof analysisText !== 'string' || !analysisText.trim()) {
        throw new Error(aiResponse?.error || 'The AI provider could not complete this contract review.');
      }

      // Calculate risk score and convert to plain language
      const riskScore = this.calculateRiskScore(analysisText);
      const plainLanguageAnalysis = this.convertToPlainLanguage(analysisText);

      // Parse structured analysis
      const structuredData = this.parseStructuredAnalysis(analysisText);

      const analysis = {
        id: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType,
        extractedText: extractedText,
        analysis: analysisText,
        plainLanguageAnalysis: plainLanguageAnalysis,
        riskScore: riskScore,
        riskLevel: this.getRiskLevelFromScore(riskScore),
        deviations: extractedText.length > 100 ? 'Potential deviations detected' : null,
        analyzedAt: new Date().toISOString(),
        // Structured data for visualization
        structuredData: structuredData
      };

      // Save analysis
      this.saveAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('Contract analysis error:', error);
      throw error;
    }
  }

  // Get risk level from numerical score
  getRiskLevelFromScore(score) {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  // Fair Contract Deviation Detection
  detectContractDeviations(extractedText) {
    const govTemplates = {
      employment: ['standard working hours 8-9 hours', 'notice period 30-90 days', 'overtime compensation', 'medical benefits'],
      freelance: ['payment within 30 days', 'IP ownership clarification', 'termination clause', 'dispute resolution'],
      service: ['service level agreement', 'liability limitations', 'data protection', 'confidentiality']
    };

    const harshClauses = [
      'non-compete period exceeding 1 year',
      'penalty exceeding 3 months salary',
      'unlimited liability',
      'immediate termination without cause',
      'IP assignment without compensation',
      'exclusive services requirement'
    ];

    return { govTemplates, harshClauses };
  }

  // ELI5 Risk Score Calculator
  calculateRiskScore(analysisText) {
    let riskScore = 0;
    const text = analysisText.toLowerCase();

    // High risk indicators (+20 each)
    if (text.includes('void') || text.includes('illegal')) riskScore += 20;
    if (text.includes('non-compete') && text.includes('restraint')) riskScore += 20;
    if (text.includes('penalty') && text.includes('excessive')) riskScore += 20;
    if (text.includes('unfair') || text.includes('unconscionable')) riskScore += 15;

    // Medium risk indicators (+10 each)
    if (text.includes('ambiguous') || text.includes('unclear')) riskScore += 10;
    if (text.includes('one-sided') || text.includes('biased')) riskScore += 10;

    return Math.min(riskScore, 100);
  }

  // Convert legal jargon to plain language
  convertToPlainLanguage(legalText) {
    const translations = {
      'restraint of trade': 'stops you from working for competitors',
      'non-compete clause': 'prevents you from working elsewhere',
      'penalty clause': 'charges you money if you break the contract',
      'liquidated damages': 'fixed amount you must pay if contract is broken',
      'indemnification': 'you must pay for any losses they face',
      'force majeure': 'uncontrollable events like natural disasters',
      'intellectual property assignment': 'they own everything you create',
      'confidentiality clause': 'you cannot share their business secrets'
    };

    let plainText = legalText;
    Object.entries(translations).forEach(([legal, plain]) => {
      plainText = plainText.replace(new RegExp(legal, 'gi'), plain);
    });

    return plainText;
  }

  // Parse structured analysis into organized sections
  parseStructuredAnalysis(analysisText) {
    const sections = {
      executiveSummary: '',
      keyClauses: [],
      hiddenRisks: [],
      unfairTerms: [],
      complianceScores: {},
      recommendations: []
    };

    try {
      // Extract Executive Summary
      const summaryMatch = analysisText.match(/## EXECUTIVE SUMMARY\s+([\s\S]*?)(?=##|$)/i);
      if (summaryMatch) {
        sections.executiveSummary = summaryMatch[1].trim();
      }

      // Extract Key Clauses
      const clausesMatch = analysisText.match(/## KEY CLAUSES\s+([\s\S]*?)(?=##|$)/i);
      if (clausesMatch) {
        const clauseText = clausesMatch[1];
        const clauseBlocks = clauseText.split(/- \*\*Clause Name\*\*:/).filter(b => b.trim());

        clauseBlocks.forEach(block => {
          const nameMatch = block.match(/^([^\n]+)/);
          const summaryMatch = block.match(/- \*\*Summary\*\*:\s*([^\n]+)/);
          const riskMatch = block.match(/- \*\*Risk Level\*\*:\s*([^\n]+)/);
          const detailsMatch = block.match(/- \*\*Details\*\*:\s*([\s\S]*?)(?=- \*\*|$)/);

          if (nameMatch) {
            sections.keyClauses.push({
              name: nameMatch[1].trim(),
              summary: summaryMatch ? summaryMatch[1].trim() : '',
              riskLevel: riskMatch ? riskMatch[1].trim() : 'Low',
              details: detailsMatch ? detailsMatch[1].trim() : ''
            });
          }
        });
      }

      // Extract Hidden Risks
      const risksMatch = analysisText.match(/## HIDDEN RISKS\s+([\s\S]*?)(?=##|$)/i);
      if (risksMatch) {
        const riskText = risksMatch[1];
        const riskBlocks = riskText.split(/- \*\*Risk\*\*:/).filter(b => b.trim());

        riskBlocks.forEach(block => {
          const riskMatch = block.match(/^([^\n]+)/);
          const severityMatch = block.match(/- \*\*Severity\*\*:\s*([^\n]+)/);
          const impactMatch = block.match(/- \*\*Impact\*\*:\s*([^\n]+)/);
          const recommendationMatch = block.match(/- \*\*Recommendation\*\*:\s*([\s\S]*?)(?=- \*\*|$)/);

          if (riskMatch) {
            sections.hiddenRisks.push({
              risk: riskMatch[1].trim(),
              severity: severityMatch ? severityMatch[1].trim() : 'Medium',
              impact: impactMatch ? impactMatch[1].trim() : '',
              recommendation: recommendationMatch ? recommendationMatch[1].trim() : ''
            });
          }
        });
      }

      // Extract Unfair/Illegal Terms
      const unfairMatch = analysisText.match(/## UNFAIR OR ILLEGAL TERMS\s+([\s\S]*?)(?=##|$)/i);
      if (unfairMatch) {
        const unfairText = unfairMatch[1];
        const unfairBlocks = unfairText.split(/- \*\*Term\*\*:/).filter(b => b.trim());

        unfairBlocks.forEach(block => {
          const termMatch = block.match(/^([^\n]+)/);
          const issueMatch = block.match(/- \*\*Legal Issue\*\*:\s*([^\n]+)/);
          const lawMatch = block.match(/- \*\*Applicable Law\*\*:\s*([^\n]+)/);
          const enforceMatch = block.match(/- \*\*Enforceability\*\*:\s*([^\n]+)/);
          const altMatch = block.match(/- \*\*Alternative\*\*:\s*([\s\S]*?)(?=- \*\*|$)/);

          if (termMatch) {
            sections.unfairTerms.push({
              term: termMatch[1].trim(),
              legalIssue: issueMatch ? issueMatch[1].trim() : '',
              applicableLaw: lawMatch ? lawMatch[1].trim() : '',
              enforceability: enforceMatch ? enforceMatch[1].trim() : '',
              alternative: altMatch ? altMatch[1].trim() : ''
            });
          }
        });
      }

      // Extract Compliance Scores
      const complianceMatch = analysisText.match(/## COMPLIANCE ASSESSMENT\s+([\s\S]*?)(?=##|$)/i);
      if (complianceMatch) {
        const complianceText = complianceMatch[1];
        const scoreMatches = complianceText.matchAll(/- ([^:]+):\s*(\d+)\/100/g);

        for (const match of scoreMatches) {
          const category = match[1].trim();
          const score = parseInt(match[2]);
          sections.complianceScores[category] = score;
        }
      }

      // Extract Recommendations
      const recommendMatch = analysisText.match(/## RECOMMENDATIONS\s+([\s\S]*?)(?=$)/i);
      if (recommendMatch) {
        const recommendText = recommendMatch[1];
        const lines = recommendText.split('\n').filter(l => l.trim());
        sections.recommendations = lines
          .filter(l => l.match(/^\d+\.|^-/))
          .map(l => l.replace(/^\d+\.|-/, '').trim());
      }

    } catch (error) {
      console.error('Error parsing structured analysis:', error);
    }

    return sections;
  }
  async getAdaptiveLegalAdvice(issue, context = {}) {
    const reasoningPrompt = `
Apply adaptive legal reasoning to this issue using Indian legal framework:

ISSUE: ${issue}
CONTEXT: ${JSON.stringify(context)}

Provide analysis with:

**LEGAL ISSUE IDENTIFICATION:**
[Identify core legal problems]

**INDIAN LAW MAPPING:**
[Map each issue to specific Indian Acts & Sections]

**CONTEXTUAL ANALYSIS:**
[Analyze based on provided context]

**CLARIFYING QUESTIONS:**
[Ask specific questions to better understand the situation]

**SECTION-WISE REMEDIES:**
[Provide remedies mapped to each applicable section]

**ACTION PLAN:**
[Step-by-step legal action plan with timelines]

Focus exclusively on Indian legal framework.`;

    return await this.sendMessage(reasoningPrompt);
  }

  // Save analysis to localStorage
  saveAnalysis(analysis) {
    try {
      const analyses = this.getAnalyses();
      analyses.unshift(analysis);
      localStorage.setItem(this.storageKey, JSON.stringify(analyses));
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  }

  // Get all saved analyses
  getAnalyses() {
    try {
      const analyses = localStorage.getItem(this.storageKey);
      return analyses ? JSON.parse(analyses) : [];
    } catch (error) {
      console.error('Error loading analyses:', error);
      return [];
    }
  }

  // Delete analysis
  deleteAnalysis(analysisId) {
    try {
      const analyses = this.getAnalyses();
      const filtered = analyses.filter(analysis => analysis.id !== analysisId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      return false;
    }
  }
}

export const contractAnalysisService = new ContractAnalysisService();
export default contractAnalysisService;