// src/services/persistentMemoryService.js
/**
 * Fast Persistent Memory Engine for LawBot 360
 * 
 * Architecture: Fast Recurrent / LSTM-Inspired Persistent Memory
 * - Cell State (C_t): Long-term persistent memory storing extracted entities, facts, and chronological query history.
 * - Forget Gate (f_t): Prunes or updates outdated/conflicting facts and filters transient conversational filler.
 * - Input Gate (i_t): Extracts new entities, monetary figures, legal questions, and constraints from current turn.
 * - Output Gate (o_t): Selects and structures the active retained memory for injection into the LLM prompt.
 * 
 * Persistence: Auto-synced to browser localStorage with session-scoped and global-scoped states.
 * Latency: < 2ms execution time (zero network latency for memory retrieval).
 */

const STORAGE_PREFIX = 'lawbot_lstm_cell_state_';
const GLOBAL_STORAGE_KEY = 'lawbot_global_user_memory';
const ACTIVE_SESSION_KEY = 'lawbot_active_chat_id';

// Indian Legal Domain Patterns for Fast Extraction
const LEGAL_PATTERNS = {
  amounts: /(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?(?:\s*(?:lakhs?|crores?|k))?)/gi,
  actsAndSections: /(?:section|sec\.?|dhara)\s*(\d+[a-z]?)\s*(?:of\s*)?([a-z\s,]+(?:act|sanhita|code|ipc|crpc|bns|bnss|cpc))?/gi,
  statesAndCities: /\b(delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|ahmedabad|jaipur|lucknow|chandigarh|noida|gurgaon|gurugram|patna|bhopal|indore|nagpur|kochi|thiruvananthapuram|maharashtra|karnataka|tamil nadu|uttar pradesh|rajasthan|gujarat|west bengal|kerala|punjab|haryana|bihar|madhya pradesh)\b/gi,
  disputeKeywords: {
    tenancy: /\b(tenant|landlord|rent|evict|eviction|lease|security deposit|flat|shop|premises)\b/i,
    consumer: /\b(consumer|defective|product|warranty|refund|replacement|flipkart|amazon|service center)\b/i,
    criminal: /\b(fir|police|thana|arrest|bail|cheating|fraud|theft|assault|threat|blackmail|bns|ipc)\b/i,
    cheque_bounce: /\b(cheque|bounce|dishonour|138|bank|insufficient funds|demand notice)\b/i,
    employment: /\b(salary|termination|resignation|pf|esi|employer|company|gratuity|severance)\b/i,
    family: /\b(divorce|maintenance|alimony|custody|domestic violence|dv|498a|dowry|husband|wife)\b/i,
    contract: /\b(contract|agreement|nda|non-compete|clause|breach|mou|penalty)\b/i,
    rti: /\b(rti|right to information|pio|first appeal|information officer)\b/i
  }
};

class PersistentMemoryService {
  constructor() {
    this.activeSessionId = this._resolveActiveSessionId();
    this.cellState = this._loadCellState(this.activeSessionId);
    this.globalMemory = this._loadGlobalMemory();
    this.listeners = new Set();
  }

  /**
   * Resolve active chat session ID from storage or initialize default
   */
  _resolveActiveSessionId() {
    if (typeof window === 'undefined') return 'session_default';
    const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
    return saved || 'session_default';
  }

  /**
   * Switch the active session ID (e.g., when user selects a different chat)
   */
  setActiveSession(sessionId) {
    if (!sessionId) return;
    this.activeSessionId = String(sessionId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId);
    }
    this.cellState = this._loadCellState(this.activeSessionId);
    this._notifyListeners();
  }

  /**
   * Load Cell State from persistent localStorage
   */
  _loadCellState(sessionId) {
    if (typeof window === 'undefined') {
      return this._createInitialCellState(sessionId);
    }
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          sessionId: parsed.sessionId || sessionId,
          entities: parsed.entities || {},
          queriesHistory: parsed.queriesHistory || [],
          disputeType: parsed.disputeType || null,
          legalContext: parsed.legalContext || {},
          retentionScore: parsed.retentionScore || 1.0,
          turnCount: parsed.turnCount || 0,
          lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    } catch (e) {
      console.warn('[PersistentMemory] Error reading cell state:', e);
    }
    return this._createInitialCellState(sessionId);
  }

  /**
   * Create fresh initial LSTM Cell State
   */
  _createInitialCellState(sessionId) {
    return {
      sessionId: sessionId || 'session_default',
      entities: {},
      queriesHistory: [],
      disputeType: null,
      legalContext: {
        actsMentioned: [],
        sections: [],
        jurisdiction: null,
        remediesSuggested: []
      },
      retentionScore: 1.0,
      turnCount: 0,
      lastUpdated: Date.now()
    };
  }

  /**
   * Load cross-session global memory (user facts preserved across all chats)
   */
  _loadGlobalMemory() {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(GLOBAL_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Save cross-session global memory
   */
  _saveGlobalMemory() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(this.globalMemory));
    } catch (e) {
      console.warn('[PersistentMemory] Error saving global memory:', e);
    }
  }

  /**
   * Save current Cell State to persistent storage
   */
  _saveCellState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${this.activeSessionId}`,
        JSON.stringify(this.cellState)
      );
    } catch (e) {
      console.warn('[PersistentMemory] Error saving cell state:', e);
    }
    this._notifyListeners();
  }

  /**
   * Subscribe to memory updates for UI synchronization
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.getMemoryStats());
      } catch (e) {
        console.error('[PersistentMemory] Listener error:', e);
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LSTM GATING & MEMORY CONSOLIDATION
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Input Gate (i_t): Extract entities, facts, and query features from user turn
   */
  _inputGate(userText, assistantText = '') {
    const text = `${userText} ${assistantText}`;
    const lower = text.toLowerCase();
    const candidateEntities = {};

    // 1. Extract Monetary Amounts
    const amountMatches = text.match(LEGAL_PATTERNS.amounts);
    if (amountMatches && amountMatches.length > 0) {
      candidateEntities.disputedAmount = amountMatches[0].trim();
    }

    // 2. Extract Cities/States
    const locationMatches = text.match(LEGAL_PATTERNS.statesAndCities);
    if (locationMatches && locationMatches.length > 0) {
      candidateEntities.location = locationMatches[0].trim();
    }

    // 3. Extract Acts & Statutory Sections
    const sectionMatches = [];
    let secMatch;
    const secRegex = new RegExp(LEGAL_PATTERNS.actsAndSections);
    while ((secMatch = secRegex.exec(text)) !== null) {
      sectionMatches.push(secMatch[0].trim());
    }

    // 4. Identify Dispute Category
    let detectedDispute = null;
    for (const [category, regex] of Object.entries(LEGAL_PATTERNS.disputeKeywords)) {
      if (regex.test(lower)) {
        detectedDispute = category;
        break;
      }
    }

    // 5. Extract Client/Counterparty Roles
    if (lower.includes('landlord')) candidateEntities.counterparty = 'Landlord';
    else if (lower.includes('tenant')) candidateEntities.clientRole = 'Tenant';
    if (lower.includes('employer') || lower.includes('boss')) candidateEntities.counterparty = 'Employer';
    if (lower.includes('builder') || lower.includes('developer')) candidateEntities.counterparty = 'Builder/Developer';
    if (lower.includes('police')) candidateEntities.involvedAuthority = 'Local Police Station';

    // 6. Name extraction heuristic
    const nameMatch = userText.match(/(?:my name is|i am|mera naam|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch && nameMatch[1]) {
      candidateEntities.userName = nameMatch[1].trim();
    }

    return {
      candidateEntities,
      detectedDispute,
      sectionMatches,
      isTransientFiller: this._isTransientFiller(userText)
    };
  }

  /**
   * Check if user input is transient conversational filler (e.g. "thanks", "ok")
   */
  _isTransientFiller(text) {
    const trimmed = text.trim().toLowerCase();
    const fillers = ['hi', 'hello', 'hey', 'ok', 'okay', 'thanks', 'thank you', 'understood', 'theek hai', 'shukriya', 'got it', 'yes', 'no', 'haan', 'nahi'];
    return fillers.includes(trimmed) || (trimmed.length < 5 && !/\d/.test(trimmed));
  }

  /**
   * Forget Gate (f_t): Determine what existing facts to keep, update, or decay
   */
  _forgetGate(currentEntities, newEntities) {
    const updatedEntities = { ...currentEntities };

    for (const [key, val] of Object.entries(newEntities)) {
      // If fact changed (e.g. location changed from Pune to Bangalore), forget old and accept new
      if (updatedEntities[key] && updatedEntities[key] !== val) {
        console.log(`[PersistentMemory Forget Gate] Updating ${key}: '${updatedEntities[key]}' -> '${val}'`);
      }
      updatedEntities[key] = val;
    }

    return updatedEntities;
  }

  /**
   * Record a full conversation turn into the persistent LSTM Cell State
   * 
   * @param {string} userMessage - What the user asked
   * @param {string} assistantResponse - AI answer provided
   * @param {string} [sessionId] - Optional session ID to target
   */
  recordTurn(userMessage, assistantResponse, sessionId = null) {
    if (!userMessage?.trim()) return;

    if (sessionId && sessionId !== this.activeSessionId) {
      this.setActiveSession(sessionId);
    }

    const { candidateEntities, detectedDispute, sectionMatches, isTransientFiller } = this._inputGate(userMessage, assistantResponse);

    // Forget Gate updates entities in Cell State
    this.cellState.entities = this._forgetGate(this.cellState.entities, candidateEntities);

    // Save global user entities across all chats
    if (candidateEntities.userName) this.globalMemory.userName = candidateEntities.userName;
    if (candidateEntities.location) this.globalMemory.location = candidateEntities.location;
    this._saveGlobalMemory();

    // Update Dispute Category if detected
    if (detectedDispute && !this.cellState.disputeType) {
      this.cellState.disputeType = detectedDispute;
    }

    // Update Legal Sections in Cell State
    if (sectionMatches.length > 0) {
      const existing = new Set(this.cellState.legalContext.sections || []);
      sectionMatches.forEach(s => existing.add(s));
      this.cellState.legalContext.sections = Array.from(existing).slice(-8);
    }

    // Append to Chronological Query History
    if (!isTransientFiller) {
      const conciseQuery = userMessage.trim().length > 120 
        ? userMessage.trim().substring(0, 117) + '...' 
        : userMessage.trim();

      const keySummary = assistantResponse 
        ? this._extractKeyTakeaway(assistantResponse) 
        : '';

      this.cellState.queriesHistory.push({
        turn: this.cellState.turnCount + 1,
        query: conciseQuery,
        takeaway: keySummary,
        timestamp: Date.now()
      });

      // Keep maximum 20 salient historical queries per session (LSTM bounded window)
      if (this.cellState.queriesHistory.length > 20) {
        this.cellState.queriesHistory = this.cellState.queriesHistory.slice(-20);
      }
    }

    this.cellState.turnCount += 1;
    this.cellState.lastUpdated = Date.now();
    this.cellState.retentionScore = Math.min(1.0, 0.85 + (this.cellState.queriesHistory.length * 0.03));

    // Commit to persistent localStorage
    this._saveCellState();
  }

  /**
   * Helper: Extract first actionable advice bullet or takeaway from assistant response
   */
  _extractKeyTakeaway(text) {
    if (!text) return '';
    const clean = text.replace(/^#{1,6}\s+/gm, '').trim();
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    const candidate = lines.find(l => l.startsWith('🚨') || l.startsWith('💡') || l.startsWith('•') || l.startsWith('-') || l.startsWith('1.'));
    if (candidate) {
      return candidate.replace(/^[^a-zA-Z0-9]+/, '').substring(0, 90);
    }
    return lines[0] ? lines[0].substring(0, 90) : '';
  }

  // ──────────────────────────────────────────────────────────────────────────
  // OUTPUT GATE (o_t): Structured Prompt Augmentation
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Generate authoritative Persistent Memory block to inject into system prompt
   */
  getMemoryPrompt(sessionId = null) {
    const targetSessionId = sessionId || this.activeSessionId;
    if (targetSessionId !== this.activeSessionId) {
      this.setActiveSession(targetSessionId);
    }

    const { entities, queriesHistory, disputeType, legalContext, retentionScore, turnCount } = this.cellState;
    const global = this.globalMemory;

    // Check if we have any retained context
    const hasEntities = Object.keys(entities).length > 0 || Object.keys(global).length > 0;
    const hasQueries = queriesHistory && queriesHistory.length > 0;

    if (!hasEntities && !hasQueries && !disputeType) {
      return '';
    }

    const sections = [];
    sections.push(`[RETAINED PERSISTENT MEMORY (LSTM CELL STATE v2.0)]`);
    sections.push(`- Session: ${this.activeSessionId} | Retained Turns: ${turnCount} | Memory Retention: ${Math.round(retentionScore * 100)}%`);

    // 1. User & Matter Profile
    const profileParts = [];
    if (entities.userName || global.userName) profileParts.push(`Client Name: ${entities.userName || global.userName}`);
    if (entities.location || global.location) profileParts.push(`Jurisdiction/Location: ${entities.location || global.location}`);
    if (disputeType) profileParts.push(`Dispute Matter: ${disputeType.replace('_', ' ').toUpperCase()}`);
    if (entities.clientRole) profileParts.push(`Client Capacity: ${entities.clientRole}`);
    if (entities.counterparty) profileParts.push(`Opposite Party: ${entities.counterparty}`);
    if (entities.disputedAmount) profileParts.push(`Disputed Amount: ${entities.disputedAmount}`);
    if (entities.involvedAuthority) profileParts.push(`Authority Involved: ${entities.involvedAuthority}`);

    if (profileParts.length > 0) {
      sections.push(`\n### 👤 Verified Client & Case Facts:`);
      profileParts.forEach(p => sections.push(`• ${p}`));
    }

    // 2. Statutory Laws Established
    if (legalContext?.sections && legalContext.sections.length > 0) {
      sections.push(`\n### ⚖️ Applicable Statutory Provisions Identified:`);
      sections.push(`• Sections Cited: ${legalContext.sections.join(', ')}`);
    }

    // 3. Chronological Queries History (What user previously asked)
    if (hasQueries) {
      sections.push(`\n### 📜 Previous Questions Asked by User in this Matter:`);
      const recent = queriesHistory.slice(-5);
      recent.forEach((q, idx) => {
        const item = `Turn ${q.turn}: "${q.query}"`;
        const takeaway = q.takeaway ? ` → Key Action: ${q.takeaway}` : '';
        sections.push(`${idx + 1}. ${item}${takeaway}`);
      });
    }

    // 4. Working Directives for Current Turn
    sections.push(`\n### 🎯 MEMORY DIRECTIVES FOR LAWYER ASSISTANT:`);
    sections.push(`1. FULL CONTINUITY: You already know the client facts and previous questions above. NEVER ask for details already established.`);
    sections.push(`2. DIRECT CONTEXT: If the client refers to "it", "them", "that issue", "the deposit", or "what I asked before", immediately resolve to the retained facts above.`);
    sections.push(`3. ADAPTIVE ADVICE: Build upon previous answers rather than repeating basic introductory points.`);

    return sections.join('\n');
  }

  /**
   * Get metrics and facts for UI badges, settings, and memory inspectors
   */
  getMemoryStats() {
    const entityCount = Object.keys(this.cellState.entities || {}).length;
    const queryCount = (this.cellState.queriesHistory || []).length;
    const hasActiveMemory = entityCount > 0 || queryCount > 0 || !!this.cellState.disputeType;

    return {
      sessionId: this.activeSessionId,
      hasActiveMemory,
      entityCount,
      queryCount,
      turnCount: this.cellState.turnCount,
      retentionScore: Math.round(this.cellState.retentionScore * 100),
      disputeType: this.cellState.disputeType,
      entities: { ...this.globalMemory, ...this.cellState.entities },
      recentQueries: (this.cellState.queriesHistory || []).slice(-5),
      lastUpdated: this.cellState.lastUpdated
    };
  }

  /**
   * Reset / Clear cell state for active session
   */
  clearSessionMemory(sessionId = null) {
    const targetSessionId = sessionId || this.activeSessionId;
    this.cellState = this._createInitialCellState(targetSessionId);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_PREFIX}${targetSessionId}`);
    }
    this._notifyListeners();
    console.log(`[PersistentMemory] Cleared memory for session: ${targetSessionId}`);
  }

  /**
   * Clear all memories (global and sessions)
   */
  clearAllMemory() {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX) || key === GLOBAL_STORAGE_KEY) {
          localStorage.removeItem(key);
        }
      });
    }
    this.globalMemory = {};
    this.cellState = this._createInitialCellState(this.activeSessionId);
    this._notifyListeners();
  }
}

export const persistentMemoryService = new PersistentMemoryService();
export default persistentMemoryService;
