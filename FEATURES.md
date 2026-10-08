# LawBot360 (LawAgent360) - Product Features & Walkthrough Guide

## 🚀 Overview & Architecture

**LawBot360 (transitioning to LawAgent360)** is India’s most advanced, multi-agent AI legal assistant and statutory compliance platform. It is engineered to democratize access to justice and simplify business compliance for individuals, freelancers, and small-to-medium enterprises (SMEs) under Indian Law.

By combining cutting-edge LLMs (Gemini 3.5 Flash, Claude 3.5 Sonnet) with multi-agent orchestration, vector databases (RAG), and graph databases (Graph RAG), LawBot360 acts as an automated "legal command center." It bridges the gap between complex legal documents, statutory government databases, and the everyday citizen.

---

## 🎨 Unified Workspace Layout & Business Profiling

### 1. Active Business Profile Switcher
*   **Dynamic Customization**: In the sidebar navigation, users can switch between active business profiles (e.g., **Sole Proprietorship**, **Private Limited (Pvt Ltd)**, or **LLP**).
*   **Automatic Tailoring**: Changing the profile updates `localStorage` and automatically updates:
    *   Applicable statutory deadlines in the **Compliance Calendar**.
    *   Personalized recommendations in the **Scheme Discovery Engine**.
    *   Industry-relevant updates in the **Regulatory Feed**.
    *   Checklists inside the **Business Setup Workflows**.

### 2. Multi-Provider AI Routing Engine
*   **Resiliency & Failover**: Built-in client and server-side fallback routers ensure continuous operation. In case of API rate limits or outages, the platform seamlessly cascades queries: **Gemini Pro/Flash 3.5** $\rightarrow$ **Claude 3.5 Sonnet** $\rightarrow$ **Groq** $\rightarrow$ **NVIDIA NIM** $\rightarrow$ **OpenRouter**.
*   **Dual Storage Sync**: Syncs seamlessly with Cloud Firestore (for persistent data) and gracefully falls back to structured `localStorage` when offline.

---

## 🦾 Core Product Features (Page by Page)

### 📊 1. Interactive Command Dashboard
The dashboard serves as the central mission control, featuring high-fidelity UX elements and smooth animations:
*   **Live Statistics Metrics**: Shows real-time counts of Consultations, Generated Documents, Lawyer Connections, and Active Court Cases.
*   **Interactive Legal Ecosystem Graph**: A live SVG visualization of your company's entities, active licenses, filing deadlines, government schemes, and generated documents. Hovering or clicking reveals connections between legal obligations.
*   **Suggested Quick Actions**: One-click shortcuts to initiate AI Consultations or start Contract Analysis.
*   **Active Workflows Stage Tracker**: Displays progress bars and current milestones for active workflows (e.g., business setup progress or notice drafting timelines).
*   **Compliance Health Circular Dial**: Visual gauge calculating compliance score based on filing completions.
*   **Statutory Risk Radar Timeline**: Chronological warning system for overdue filings, detailing penalty escalations.
*   **Emergency SOS Panel**: A quick-trigger safety mechanism providing immediate legal rights during arrests, police interactions, or detentions.

---

### 💬 2. AI Research Chat App (Conversational Legal Agent)
An advanced interface designed for natural language legal exploration:
*   **Contextual Dialogue Memory**: Remembers past thread interactions to form strategic responses.
*   **Indian Acts & Sections Reference Pills**: Automatically parses AI responses to identify applicable laws (such as the *Consumer Protection Act, 2019*, *Transfer of Property Act, 1882*, or *Right to Information Act, 2005*) and displays them as clickable pills.
*   **RAG & Graph RAG Context Syncer**: Displays visual badges showing when the AI fetched facts from uploaded company policies (RAG) or linked compliance nodes (Graph RAG).
*   **Multi-language Auto-Detection**: Supports Hindi, English, and 28+ regional Indian languages.
*   **Voice Integration**:
    *   **Real-time Speech-to-Text**: Integrated via **Deepgram API** with fallback to standard Web Speech API for hands-free queries.
    *   **Text-to-Speech**: Listen to detailed AI advice by clicking the audio speaker button next to responses.
*   **One-Click Document Generation**: Automatically prompts the user to draft forms (like RTI applications, FIRs, or Consumer Complaints) when the chat discussion reaches an actionable remedy.

---

### 🔍 3. AI Contract Analysis & Risk Radar
A drag-and-drop document review station:
*   **Multimodal OCR Processing**: Upload PDF, Word, TXT, or scanned images (JPEG, PNG). The platform uses Gemini Multimodal OCR to extract text and details.
*   **Risk Level Classification**: Assigns a risk level (Critical, High, Medium, Low) and an overall risk score (0-100).
*   **Comprehensive Interactive Tabs**:
    *   **Overview**: Plain English executive summaries of legal terms. Includes an audio play button to read summaries aloud.
    *   **Key Terms**: Summarizes critical clauses (indemnification, termination, governing law).
    *   **Hidden Risks**: Exposes hidden red flags and their potential business consequences.
    *   **Problem Areas**: Highlights unfair/illegal clauses and drafts balanced alternatives.
    *   **Actions**: Checklists of points to negotiate.
    *   **Ask Questions Sidebar**: Pins a contextual chatbot to the uploaded contract, allowing the user to ask questions like: *"Does this agreement contain a non-compete clause, and is it valid in India?"*

---

### 🔐 4. Knowledge Vault & SIS Store
An encrypted, organized vault for corporate files:
*   **Smart Categorization**: Sorts files into Tax & GST, Identity & Registrations, Licenses, Contracts, and Company Policies.
*   **DigiLocker Integration (OTP-Simulated)**: Lets users link Aadhaar/Mobile credentials, request OTP, and automatically import verified registration papers (GST Form REG-06, Company PAN) directly from government databases.
*   **Internal Policy indexing**: Ingests company manuals and standard operating procedures (SOPs). The AI chatbot reads these files to answer internal compliance queries.
*   **Interactive Knowledge Graph**: Maps relationships between your corporate profile, active certificates, and statutory dates.

---

### 📅 5. Statutory Compliance Calendar
An automated compliance tracker tailored to business structures (e.g., Private Limited company):
*   **Pre-Configured Deadlines**: Automatically tracks core dates (GSTR-1 Sales Return, GSTR-3B Tax Payments, EPFO/ESIC contributions, TDS return filings, and ROC Form MGT-7A).
*   **Statutory Penalty Late Fee Calculator**: Simulates financial liabilities for filing delays based on exact sections of the Income Tax / GST Acts (e.g., ₹50/day or 18% p.a. interest).
*   **Apple/Google Calendar Sync**: Generates and downloads a `.ics` calendar file to import deadlines into Google, Microsoft, or Apple calendar.

---

### 💡 6. Government Scheme Discovery Engine
*   **Profile-Based Recommendations**: Automatically analyzes entity structure, turnover, and operational details.
*   **Subsidies Matching**: Directs companies to matching benefits (such as low-interest Mudra loans, Startup India tax exemptions, or PMEGP margin capitals).
*   **Requirements checklist**: Outlines exact documentation requirements (Certificate of Incorporation, Pitch Decks, PAN) and provides direct links to apply.

---

### 📰 7. AI Regulatory Updates Feed
*   **Tailored Gazettes**: Continuously parses notifications from government portals (CBIC, CBDT, MCA, RBI, EPFO) and shows updates relevant only to your business industry and state.
*   **AI Briefings & Checklists**: Explains amendments in simple terms, lists corporate consequences, and generates action plans.
*   **Board Memorandum Disbursals**: Drafts a structured PDF/email memo summarizing the regulation and its impact, allowing you to email the executive board in one click.

---

### ⚙️ 8. Agentic Workflows Manager
Features autonomous state machines tracking sequential multi-step operations:
*   **GSTR-1 Outward Return Preparation**:
    *   Scans sales registers in the Vault $\rightarrow$ Parses and extracts invoice records $\rightarrow$ Automates HSN/SAC validation $\rightarrow$ Calculates tax liability $\rightarrow$ Simulates portal filing.
*   **Legal Notice Recovery Lifecycle**:
    *   Inputs dispute terms $\rightarrow$ Generates legally binding notice under Indian acts $\rightarrow$ Registers Speed Post tracking ID $\rightarrow$ Initiates 30-day settlement countdown.
*   **Business Setup Onboarding**:
    *   Step-by-step checklist (proposed name search,DSC class-3, DIN, SPICe+ MCA filing, bank opening, EPFO/ESIC activation, INC-20A commencement declaration).

---

### ⚖️ 9. Case Manager & Litigation Tracker
*   **Chronological Milestones**: Tracks hearings, evidence lists, witness statements, and case values.
*   **Deep AI Case Assessment**: Runs Gemini to compile case strength analysis, list missing evidence, and suggest exactly which forum or court (such as the District Consumer Forum) has proper jurisdiction.

---

### 📞 10. Lawyer Network & AI Voice Consultations
*   **Attorneys Directory**: Directory of verified specialists in Consumer, Property, Criminal, and Corporate Law, sorted by experience and fees.
*   **ElevenLabs voice consultation**:
    *   Speak directly to an **AI legal associate** using high-fidelity **ElevenLabs ConvAI**.
    *   Change assistant voice genders (Male/Female) instantly.
    *   **Auto-Transcription & Summary**: The voice call is transcribed, and when finished, generates a comprehensive **Consultation Report** summarizing the case fact-sheet, legal provisions, and recommended actions.
*   **Gemini Live Lawyer & Harmony Singh Calls**: WebRTC voice agents for real-time legal Q&A.

---

## 🎬 Step-by-Step Product Walkthrough (Demo Script)

Follow this step-by-step scenario to demonstrate the platform’s capabilities during a live demo or hackathon review.

### 👤 The Persona
*   **User**: *Ramesh*, a small business owner launching a food-tech startup in Mumbai (*Acme Foods*).
*   **Challenge**: Needs to incorporate his business, protect his brand, review vendor contracts, and ensure GST compliance.

---

### 📍 Step 1: Landing Page & Secure Authentication
1.  Navigate to the landing page (`/`). View the modern dark/light glassmorphic UI, dynamic gradients, and live stats counters.
2.  Click **"Watch Demo"** or **"Start Legal Chat"**.
3.  Proceed to the **Login Page** (`/login`) and log in securely.
4.  You are redirected to the main dashboard.

### 📍 Step 2: Entity Onboarding
1.  Navigate to the **Onboarding Wizard** (`/dashboard/onboarding`).
2.  **Step 1**: Select entity type: **Private Limited Company (Pvt Ltd)**.
3.  **Step 2**: Enter details:
    *   *Entity Name*: `Acme Foods Private Limited`
    *   *Industry*: `Food & Beverages / Restaurant (FSSAI)`
    *   *State*: `Maharashtra`
    *   *Turnover*: `50L - 2Cr`
4.  **Step 3**: Check active registrations (e.g., GSTIN, PAN, Udyam MSME). Click **"Save Profile & Launch Agent"**.
5.  Observe how the app redirects you to the Vault.

### 📍 Step 3: Vault Documents & DigiLocker Sync
1.  Navigate to the **Vault** (`/dashboard/vault`).
2.  Notice the preloaded documents. Select **"Import from DigiLocker"**.
3.  Enter Aadhaar/Phone number in the simulation popup, click **"Request secure OTP"**, enter the mock OTP, and click **"Sync Documents"**.
4.  See the official *GST Registration Certificate (Form REG-06)* and *PAN Card* pull into your Vault with **"DigiLocker Verified"** status.
5.  Click on a document and select **"View OCR Data"** to review the metadata extracted by Gemini.
6.  Click on the **"Knowledge Graph"** tab to see your business entity connected visually to tax certificates, compliance deadlines, and relevant schemes.

### 📍 Step 4: AI Voice Consultation (Ramesh Asks for Advice)
1.  Navigate to **Find Lawyers** (`/dashboard/lawyers`).
2.  Under **Instant Assistance**, click **"Start Free Consultation"** on the AI Associate Card.
3.  Choose the assistant gender, and speak to the voice agent (simulated via ElevenLabs ConvAI widget). Describe the business issue: *"I am starting a food business in Mumbai, what licenses do I need?"*
4.  Speak with the voice agent. When done, click **"End Consultation"**.
5.  A **Consultation Report** automatically generates on screen. Read the summary detailing requirements for FSSAI registration, Shop & Establishment License, and GST compliance.

### 📍 Step 5: AI Research Chat & Document Generation
1.  Navigate to **AI Research Chat** (`/dashboard/chat`).
2.  Type: *"I bought a commercial kitchen oven for Acme Foods that arrived damaged, and the seller refuses a refund."*
3.  Submit the message. Watch the AI parse the query and return relevant Indian laws (citing **Consumer Protection Act, 2019 - Section 35** in a pill).
4.  Click the speaker button to hear the advice spoken aloud.
5.  Notice the **"Draft CONSUMER COMPLAINT"** button appearing under the message. Click it.
6.  An editor opens showing a formatted complaint addressed to the District Consumer Disputes Redressal Forum.
7.  Click **"Save Securely"** to store it in your Documents.

### 📍 Step 6: AI Contract Analysis (Reviewing a Vendor Agreement)
1.  Navigate to **Contract Analysis** (`/contract-analysis`).
2.  Upload a vendor logistics agreement (use the mock file upload).
3.  Watch the analysis circular progress bar run Gemini Multimodal OCR.
4.  Once analyzed, review the **Contract Analysis Report** modal:
    *   Note the **High Risk** rating and score.
    *   Click **"Listen"** to hear the plain English executive summary.
    *   Navigate through the tabs: view extracted **Key Terms**, **Hidden Risks**, and **Problem Areas** (which explains why a non-compete clause in the agreement is void under *Section 27 of the Indian Contract Act*).
    *   Open the **"Ask Questions"** tab, type: *"What is the notice period for terminating this agreement?"* and see the AI answer instantly based on the contract context.

### 📍 Step 7: Stat Regulatory updates & Disbursing Memos
1.  Navigate to **Regulatory Feed** (`/dashboard/regulatory-updates`).
2.  Observe how the feed is pre-filtered for a *Pvt Ltd* food company in *Maharashtra*.
3.  Click on the CBIC notification regarding e-invoicing.
4.  Expand the update to view the AI summary, penalty consequences, and the actionable checklist.
5.  Click **"Send Board Memo"**. A popup drafts a memorandum for the board of directors. Click **"Disburse Executive Memo"** to simulate emailing the report.

### 📍 Step 8: Running Compliance Workflows
1.  Navigate to **Compliance Workflows** (`/dashboard/workflows`).
2.  Click **"Launch Compliance Workflow"**, select **"Legal Notice Recovery"**, and fill in the vendor dispute details. Click **"Launch"**.
3.  **Step 1**: The notice is drafted. Click **"Draft notice"** to view and copy the generated legal document. Click **"Mark Completed"**.
4.  **Step 2**: Settle on dispatch. Click **"Dispatch & Track"**, enter a mock Speed Post tracking number, and witness the system initiate a 30-day deadline tracker.
5.  Go to the **Dashboard** (`/dashboard`) and see the **Legal Ecosystem Graph** updated, showing the new active workflow and notice document nodes connected in real time.

---

## 🔒 Security & Privacy

*   **Encryption**: All documents stored in the Vault are secured with AES-256 equivalent database security.
*   **Privacy-first data retention**: Chat histories are stored locally in the client's browser profile, preventing unauthorized access.
*   **RAG sandboxing**: User policy vectors are isolated, ensuring proprietary company manuals are never leaked or used to train public LLM models.

---

*LawBot360 - Empowering every Indian citizen and business with accessible, professional legal assistance through advanced AI technology.*