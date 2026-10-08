# LawBot 360 — Hackathon MVP Files (Frontend-Only Edition)

This version includes **no custom backend** — all logic runs on the client with Firebase as BaaS and OpenRouter API for AI reasoning. Designed for **maximum innovation, impact, and hackathon readiness**.

---

## <README.md>

# LawBot 360 — India’s AI Legal Advisor & Justice Assistant

**Team A — LawBot 360**  
**Domain:** Open Innovation / Technology & Software

**Tagline:** *Empowering every citizen with lawyer-like intelligence in their pocket.*

---

### 🚨 Problem Statement
Millions of Indians, especially in rural and low-income regions, lack affordable access to legal advice. Court systems, RTI filings, and legal paperwork are complex and confusing. Language barriers further block access to justice.

---

### 💡 Proposed Solution
LawBot 360 is a **multilingual AI legal assistant** that acts as a virtual lawyer — capable of **reasoning**, **drafting documents**, and **guiding users autonomously**. It helps citizens:
- Converse naturally in local languages.
- Understand their rights and relevant laws.
- Auto-draft RTIs, complaints, petitions, and affidavits.
- Connect to verified lawyers or NGOs.
- Track case status (mock integration for MVP).

---

### 🎯 Hackathon MVP Goal
Deliver a working mobile-first app where users can:
1. Describe a legal issue in plain English/Hindi.
2. AI analyzes it, asks clarifying questions, and gives proper legal guidance.
3. AI auto-generates legal drafts and allows downloads.
4. Store and view saved cases in Firestore.
5. (Optional) Connect with a mock lawyer directory.

---

## <MVP_FEATURES.md>

# Minimum Viable Product (Frontend + Firebase)

### 🧠 1. Smart Legal Chat (Core)
- Multilingual (English/Hindi/local)
- AI understands problems and **asks clarifying questions**.
- Responds with: summary, rights, applicable laws, and next steps.
- Context-aware responses via chat memory stored in Firestore.

**Impact:** Real reasoning → makes it feel like a real lawyer.  
**Innovation:** Adaptive questioning before advice.

---

### 📜 2. Autonomous Legal Document Generator
- AI generates legal drafts (RTI, FIR, Complaint, Affidavit) from chat context.
- User can preview, edit, and download as PDF (via jsPDF/html2pdf).
- Documents saved in Firestore under user session.

**Impact:** Saves hours of manual legal writing.
**Innovation:** One-click auto-legal documentation.

---

### ⚖️ 3. Case Type & Law Identifier
- AI extracts legal domain, acts, and sections relevant to case.
- Display in sidebar like: *Consumer Protection Act, 2019 – Sec. 2(1)(g)*.

**Impact:** Builds trust, transparency, and legal literacy.
**Innovation:** First-of-its-kind live law tagging.

---

### 🤝 4. Lawyer / NGO Connection Hub
- Display directory of verified legal aid providers (stored in Firestore JSON).
- Button to request help → triggers Firebase phone OTP auth → stores request.

**Impact:** Bridges AI and real human legal assistance.
**Innovation:** AI + verified legal ecosystem connection.

---

### 🗣️ 5. Voice Interaction (Add-on)
- Speech-to-text for easy input.
- Text-to-speech (English/Hindi) for responses.

**Impact:** Accessible for non-literate or rural users.
**Innovation:** Voice-based AI lawyer in the user’s language.

---

### 🔔 6. Saved History & Notifications
- All chats and documents saved to Firestore.
- Notifications when a case is updated or new info appears.

---

### 🧾 7. Legal Literacy Mode
- User can ask: “What are my rights as a tenant?”
- AI provides plain-language summaries of laws, rights, and examples.

**Impact:** Educates citizens while solving real problems.

---

### 🔐 8. Blockchain Timestamp (Future Stretch)
- Verifies when a document was created using web3.storage or Lit Protocol.
- Adds authenticity to legal drafts.

**Innovation:** Legal trust via decentralized proof.

---

## <ARCHITECTURE.md>

# Architecture Overview (Frontend-Only)

**Core principle:** 100% client-side using Firebase and OpenRouter API.

```
React (Vite + JSX + Tailwind + ShadCN)
│
├── /src/lib/ai.js → Calls OpenRouter API
├── /src/lib/documentAI.js → Generates RTI, complaint, affidavit templates
├── /src/lib/firebase.js → Handles Auth + Firestore
└── Firestore → Stores sessions, messages, and documents
```

### Data Flow
1. User enters text → sent to `aiChat()` in ai.js.
2. AI returns structured JSON with `follow_up`, `advice`, and `acts`.
3. If follow-up exists → show question → else show advice.
4. Optionally generate document from advice context.
5. Save everything to Firestore under user ID.

### Authentication
- Anonymous session on app open.
- Phone OTP auth only when connecting to lawyer or saving personal info.

---

## <SETUP.md>

# Project Setup

### 1️⃣ Frontend Setup
```bash
npm create vite@latest lawbot360 -- --template react
cd lawbot360
npm i tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm i firebase jspdf html2pdf.js
```

Add **ShadCN UI** components for modern cards, buttons, inputs.

### 2️⃣ Firebase Setup
- Create project in Firebase console.
- Enable Firestore + Authentication (anonymous + phone).
- Copy Firebase config → `/src/lib/firebase.js`

### 3️⃣ OpenRouter Setup
- Get API key at [https://openrouter.ai](https://openrouter.ai)
- Add `.env`:
  ```env
  VITE_OPENROUTER_API_KEY=your_api_key
  ```

### 4️⃣ Run
```bash
npm run dev
```

Deploy to **Vercel** or **Firebase Hosting**.

---

## <AI_INTEGRATION.md>

# AI Integration with OpenRouter (Frontend)

### 🧠 System Prompt
```js
const systemPrompt = `
You are LawBot 360 — India’s AI Legal Assistant.
Understand the user’s situation. If needed, ask clarifying questions (max 2).
Then provide legal advice including:
- Rights of the user
- Applicable laws/acts
- Recommended next actions
Respond in JSON:
{
  "follow_up": "string | null",
  "advice": "string",
  "acts": ["string"]
}`;
```

### 🔧 API Function (ai.js)
```js
export async function aiChat(message, context = []) {
  const body = {
    model: "mistralai/mixtral-8x7b",
    messages: [
      { role: "system", content: systemPrompt },
      ...context,
      { role: "user", content: message }
    ]
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  const text = data.choices[0].message.content;
  return JSON.parse(text);
}
```

### 📄 Document Generator (documentAI.js)
```js
export async function generateDocument(type, details) {
  const prompt = `Create a formal ${type} based on this data:\n${JSON.stringify(details, null, 2)}`;
  return await aiChat(prompt);
}
```

### ⚙️ Free AI Alternatives
- **Hugging Face Inference API** (Llama2, Mistral)
- **Ollama / GPT4All local models** (offline demo)
- **Gemini API (Google)** for reasoning fallback

---

## <AUTH_FLOW.md>

# Authentication Plan

### 🔓 Anonymous Mode (Default)
- On app open → create anonymous Firebase user.
- Store session ID in Firestore.

### 🔐 Phone Auth (When Needed)
- Trigger when user tries to:
  - Request lawyer help
  - Save document with personal info

### ⚡ Flow
1. Start as guest.
2. When user clicks *Connect Lawyer* → open phone OTP modal.
3. After verification → link anonymous account → store verified user.

---

## <FRONTEND_GUIDE.md>

# Frontend Components Map

**Main Pages**
- `/Chat.jsx` — AI chat logic, multi-turn reasoning, message bubbles.
- `/Drafts.jsx` — shows auto-generated documents.
- `/MyCases.jsx` — displays saved chat sessions.
- `/ConnectLawyer.jsx` — form + Firestore submission.

**Key Components**
- `ChatUI.jsx` → handles input, message display.
- `MessageBubble.jsx` → styled bubbles.
- `DocPreview.jsx` → document preview + download.
- `LawyerCard.jsx` → displays lawyers/NGOs.

---

## <ROADMAP.md>

# 24h Hackathon Plan (No-Backend Version)

**Hour 0–2:** Project setup (Vite + Tailwind + Firebase config).
**Hour 2–6:** Implement chat UI + aiChat() with OpenRouter.
**Hour 6–10:** Add Firestore saving for chats + document generator.
**Hour 10–14:** Add lawyer connect + phone auth.
**Hour 14–18:** Add PDF generator + legal literacy mode.
**Hour 18–22:** Polish UI + add Hindi support.
**Hour 22–24:** Deploy + record final demo.

---

## <DEPLOYMENT.md>

# Deployment Checklist

1. **Frontend:** Deploy to Vercel.
2. **Firebase:** Enable Firestore, Auth, Storage.
3. **Environment Variables:** Add OpenRouter key in Vercel.
4. **CORS:** Not needed (client-side only calls OpenRouter).
5. **Testing:** Run chat flows + document generator before demo.

---

# 💎 Impact & Innovation Summary

| Feature | Impact | Innovation |
|----------|---------|-------------|
| Adaptive legal Q&A | Personalized legal guidance | Reasoning-based agentic flow |
| Document generation | Saves cost/time for citizens | Instant auto-legal drafting |
| Multilingual + voice | Accessibility for rural India | AI understands Hindi/local dialects |
| Lawyer connect | Real help bridge | Human + AI hybrid justice system |
| Blockchain timestamp | Future trust layer | Verifiable legal document creation |
| Legal literacy mode | Spreads awareness | Teaches law interactively |

---

> **LawBot 360**: From *confusion* to *clarity*, from *questions* to *justice* — powered by AI for every Indian citizen.

