# LawBot 360: Complete A-to-Z Project & Feature Guide

---

## 1. What is LawBot 360?
**LawBot 360** is an **AI-powered legal intelligence and advisory platform** tailored specifically for the Indian legal and business landscape. It provides citizens, startups, and MSMEs with instant legal guidance, contract analysis, constitutional knowledge exploration, document generation, and direct advocate discovery.

---

## 2. Core Pillars & Features (A to Z)

### 🤖 1. AI Research Chat & Legal Advisory
* **What it does**: A conversational legal assistant that answers complex legal questions in plain language, English, Hindi, and Hinglish.
* **Statutory Compliance**: Updated to reference the **Bharatiya Nyaya Sanhita (BNS)** and **BNSS** (which replaced the old IPC & CrPC in July 2024).
* **Multi-Turn Persistent Memory**: Powered by an **LSTM-inspired memory engine** that remembers key facts (amounts, dispute category, location, and past queries) across conversation turns and page refreshes.

### 🎙️ 2. Real-Time Multilingual Voice Assistant
* **Web Voice Ingestion**: Speak directly into the browser to ask legal questions.
* **Dual-Engine Redundancy**: 
  - Primary: **Deepgram Nova-3** WebSocket streaming for fast, accurate speech recognition in Indian accents.
  - Secondary: Automatic, seamless fallback to the browser's **Web Speech API** if network latency increases or connections drop.
* **Text-to-Speech (TTS)**: Reads out answers with built-in sentence-chunking to ensure speech never freezes or clips mid-sentence.

### 📞 3. 24/7 Sarvam AI Telephony Helpline
* **Real Phone Line Integration (+91 7965480318)**: Users without smartphones or internet access can call a standard Indian telephone number.
* **Powered by Sarvam AI**: Processes speech over phone lines (PSTN/SIP) with low latency, transcribes speech in real time, and speaks back legal guidance in Hindi/English.
* **Call Transcripts & History**: View past call logs, duration, status, and transcripts directly from the dashboard.

### 📄 4. High-Speed Contract & Risk Clause Analyzer
* **Upload Agreements**: Supports PDFs, Word files (.docx), images, and plain text.
* **Comprehensive Breakdown**:
  - **Executive Summary**: Plain-language overview of the agreement.
  - **Key Clauses**: Summaries and risk levels (High/Medium/Low) for termination, payment terms, intellectual property, etc.
  - **Hidden Risks & Red Flags**: Identifies uncapped liabilities, missing grace periods, or harsh indemnities.
  - **Unfair / Illegal Terms**: Flags clauses that violate Indian law (e.g., restrictive non-competes barred by Section 27 of the Indian Contract Act, 1872).
  - **Compliance Scorecard (0–100)**: Assesses compliance with Indian contract, consumer, employment, and data protection laws.
  - **Actionable Steps**: Plain recommendations on what amendments to request.
* **Speed Optimization**: Uses bundled local PDF processing and focused prompts to complete reviews in **4–6 seconds**.

### 🌌 5. Obsidian Constitutional Graph RAG
* **Interactive Knowledge Cosmos**: A visual, force-directed node graph mapping all **395+ Articles across Parts I–XXII** of the Constitution of India.
* **Dynamic Search & Inspection**: Click on any Article node (e.g., Article 21 - Right to Life & Personal Liberty) to reveal its legal summary, landmark Supreme Court judgments, and statutory links.

### ⚖️ 6. Verified Indian Advocate Directory
* **Location & GPS Matching**: Search through 1,200+ verified advocates across Supreme Court, High Courts, and District Forums.
* **Filter by Specialization**: Corporate disputes, criminal law, consumer protection, property, cyber law, and family law.
* **One-Click Contact**: Direct phone, consultation booking, and fee overview.

### 🗄️ 7. Knowledge Vault & Secure SIS Store
* **Encrypted Document Repository**: Safely store GST certificates, agreements, policies, and statutory filings.
* **Tamper Verification**: Generates cryptographic SHA-256 hashes to verify that documents have not been modified or corrupted.
* **DigiLocker Integration Simulator**: Connects business registrations directly into the vault.

---

## 3. Technology Stack (Plain English)

```
┌──────────────────────────────────────────────────────────┐
│                      USER INTERFACE                      │
│   React 18  •  Vite 5  •  Tailwind CSS  •  Lucide Icons   │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ AI & REASONING CORE ]           [ AUDIO & VOICE PIPELINE ]
   • AWS Bedrock (Claude 3.5)        • Deepgram Nova-3 (STT)
   • Google Gemini 2.0 Flash         • Sarvam AI (Telephony API)
   • Fast LSTM Persistent Memory     • Web Speech API (Fallback)
            │                                 │
            └────────────────┬────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ KNOWLEDGE & RAG ENGINE ]        [ DOCUMENT INTELLIGENCE ]
   • Constitution of India (Graph)   • pdfjs-dist (ArrayBuffer)
   • Indian Kanoon Precedents API    • Tesseract.js (Local OCR)
   • Local Vector TF-IDF Retrieval   • SHA-256 Hash Verification
```

---

## 4. Key Workflows (How a User Uses the App)

```
1. Instant Legal Advice:
   User asks question (text or voice) ──► Retained Memory & RAG check ──► Cites BNS & Acts ──► Speaks answer

2. Contract Audit:
   Upload lease or NDA ──► Extracts text in memory ──► Identifies red flags & unfair terms ──► Visual report

3. Constitutional Search:
   Type topic ("Right to Privacy") ──► Graph highlights Article 21 ──► Shows Supreme Court precedents

4. Phone Helpline:
   Call +91 7965480318 ──► Sarvam speech recognition ──► AI provides instant verbal guidance
```

---

## 5. Why LawBot 360 Stands Out

1. **Grounded in Current Indian Law**: Built specifically for Indian statutes, referencing the latest **Bharatiya Nyaya Sanhita (BNS)** instead of deprecated colonial codes.
2. **Dual-Redundancy Systems**: If any external AI or voice service encounters network delay, fallback mechanisms ensure zero user downtime.
3. **Speed & Privacy**: Core PDF parsing, vector search, and persistent memory run directly inside the browser using client-side storage, keeping document data private and response times under 5 seconds.
