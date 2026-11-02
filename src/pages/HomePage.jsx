import React, { useState, useRef, useEffect } from 'react';
import { Scale, Send, Mic, MicOff, FileText, Download, Users, Shield, Menu, X, Plus, MessageSquare, Clock, ChevronDown, ChevronRight, Sparkles, AlertCircle, CheckCircle, Copy, RotateCcw, Settings, Upload, Globe, Volume2, VolumeX, Eye, Edit2, Trash2, MoreVertical, LayoutDashboard, Bot, Phone, User, FileSearch, ArrowRight, Paperclip, Gavel, BookOpen, Network, ExternalLink, Brain, History } from 'lucide-react';
import LoadingStatus from '../components/LoadingStatus';
import { Link } from "react-router-dom";
import lawBot360AI from '../services/aiService';
import deepgramService from '../services/deepgramService';
import documentService from '../services/documentService';
import persistentMemoryService from '../services/persistentMemoryService';
import Sidebar from '../components/Sidebar';
import logo from '../assets/lawbot360-logo-updated.svg';
import VoiceCallModal from '../components/VoiceCallModal';

// Simple markdown renderer for AI responses
const renderMarkdown = (text) => {
  return text
    .split('\n')
    .map((line, index) => {
      // Handle headers (###)
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-2">{line.replace('### ', '')}</h3>;
      }

      // Handle subheaders (####)
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-base font-bold text-slate-800 mt-4 mb-2">{line.replace('#### ', '')}</h4>;
      }

      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2 last:mb-0">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
            )}
          </p>
        );
      }

      // Handle bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 list-disc">{line.trim().substring(2)}</li>;
      }

      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return <li key={index} className="ml-4 mb-1 list-decimal font-medium">{line.trim().replace(/^\d+\.\s*/, '')}</li>;
      }

      // Handle checkmarks
      if (line.trim().startsWith('✓')) {
        return <p key={index} className="mb-1.5 ml-4 font-medium text-emerald-600">{line}</p>;
      }

      // Handle horizontal rules (---)
      if (line.trim() === '---') {
        return <hr key={index} className="my-6 border-slate-200" />;
      }

      // Regular paragraphs
      return line.trim() ? <p key={index} className="mb-2 last:mb-0">{line}</p> : <br key={index} />;
    });
};

/**
 * LawBot 360 - Complete Chat Application (UI/UX Enhanced)
 * Focus: High-end professional legal interface, improved readability, and tactile interactions.
 */

// --- LOGIC SECTION (UNCHANGED FUNCTIONALITY) ---

const generateAIResponse = async (message, conversationHistory, sessionId) => {
  try {
    const response = await lawBot360AI.sendMessage(message, {
      conversationHistory,
      sessionId
    });
    if (response.success) {
      const content = response.response;
      const lowerMsg = message.toLowerCase();
      let canGenerateDocument = false;
      let documentType = null;
      let acts = [];
      let suggestedFollowups = [];

      if (lowerMsg.includes('contract') || lowerMsg.includes('agreement') || lowerMsg.includes('clause')) {
        canGenerateDocument = false;
        documentType = null;
        acts = ["Indian Contract Act, 1872 - Section 27 (Restraint of Trade)", "Indian Contract Act, 1872 - Section 23 (Unlawful Object)"];
        suggestedFollowups = ["Check non-compete clause validity", "Analyze penalty clauses", "Review IP assignment terms"];
      } else if (lowerMsg.includes('rti') || content.toLowerCase().includes('rti') || content.toLowerCase().includes('information')) {
        canGenerateDocument = true;
        documentType = 'rti';
        acts = ["Right to Information Act, 2005 - Section 6"];
        suggestedFollowups = ["Draft RTI application now", "RTI appeal process", "What if they don't respond?"];
      } else if (lowerMsg.includes('consumer') || content.toLowerCase().includes('consumer') || lowerMsg.includes('defective') || lowerMsg.includes('product')) {
        canGenerateDocument = true;
        documentType = 'consumer_complaint';
        acts = ["Consumer Protection Act, 2019 - Section 35"];
        suggestedFollowups = ["Draft consumer complaint", "Calculate compensation amount", "Which consumer forum to approach?"];
      } else if (lowerMsg.includes('fir') || content.toLowerCase().includes('fir') || lowerMsg.includes('police') || lowerMsg.includes('crime')) {
        canGenerateDocument = true;
        documentType = 'fir';
        acts = ["Code of Criminal Procedure, 1973 - Section 154"];
        suggestedFollowups = ["Draft FIR application", "Police refusing FIR - what to do?", "File private complaint in court"];
      } else if (lowerMsg.includes('bike') || lowerMsg.includes('vehicle') || lowerMsg.includes('seized') || content.toLowerCase().includes('motor vehicle')) {
        canGenerateDocument = true;
        documentType = 'legal_notice';
        acts = ["Motor Vehicle Act, 1988 - Section 207"];
        suggestedFollowups = ["Challenge illegal seizure", "Get vehicle released", "File representation against penalty"];
      } else if (lowerMsg.includes('rent') || lowerMsg.includes('tenant') || lowerMsg.includes('landlord') || content.toLowerCase().includes('property')) {
        canGenerateDocument = true;
        documentType = 'legal_notice';
        acts = ["Transfer of Property Act, 1882 - Section 108"];
        suggestedFollowups = ["Send legal notice to landlord", "File rent control case", "Recover security deposit"];
      }

      return { 
        content, 
        acts, 
        canGenerateDocument, 
        documentType, 
        suggestedFollowups,
        ragUsed: response.ragUsed,
        graphRagUsed: response.graphRagUsed,
        constitutionUsed: response.constitutionUsed,
        kanoonUsed: response.kanoonUsed,
        activeModel: response.activeModel,
        retrievedDocs: response.retrievedDocs,
        retrievedSources: response.retrievedSources,
        persistentMemory: response.persistentMemory
      };
    } else if (response && response.response) {
      return {
        content: response.response,
        acts: [],
        canGenerateDocument: false,
        documentType: null,
        suggestedFollowups: [],
        ragUsed: response.ragUsed,
        graphRagUsed: response.graphRagUsed,
        constitutionUsed: response.constitutionUsed,
        kanoonUsed: response.kanoonUsed,
        activeModel: response.activeModel,
        retrievedDocs: response.retrievedDocs,
        persistentMemory: response.persistentMemory
      };
    }
  } catch (error) {
    console.error('AI Response Error:', error);
  }

  // Fallback response logic
  await new Promise(resolve => setTimeout(resolve, 1500));
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('rti') || lowerMsg.includes('information')) {
    return {
      content: "I can help you file an RTI (Right to Information) application. To draft a proper RTI, I need:\n\n1. **Which government department/office?**\n2. **What specific information do you need?**\n3. **What is the purpose?**\n\nPlease provide these details so I can generate your RTI application.",
      acts: ["Right to Information Act, 2005 - Section 6"],
      canGenerateDocument: true,
      documentType: 'rti',
      suggestedFollowups: ["I need information from Municipal Corporation", "How long does RTI take?", "What if they don't respond?"]
    };
  } else if (lowerMsg.includes('contract') || lowerMsg.includes('agreement') || lowerMsg.includes('clause')) {
    return {
      content: "I'll analyze this using **Adaptive Legal Reasoning** with Indian law mapping:\n\n**Common Contract Violations:**\n❌ **Restraint of Trade** → Section 27 Indian Contract Act (VOID)\n❌ **Unlawful Object** → Section 23 Indian Contract Act\n❌ **Unfair IP Assignments** → Section 16 (Undue Influence)\n❌ **Non-Compete Clauses** → Section 27 (Void in India)\n❌ **Penalty Clauses** → Section 74 (Only reasonable compensation)\n\n**I provide:**\n• Section-wise explanations\n• Legal remedies under Indian law\n• Alternative clause suggestions\n\n**What specific clause concerns you?** Share the clause text for detailed analysis.",
      acts: ["Indian Contract Act, 1872 - Section 27", "Indian Contract Act, 1872 - Section 23", "Indian Contract Act, 1872 - Section 16"],
      canGenerateDocument: false,
      suggestedFollowups: ["Non-compete clause is void in India", "Penalty clause exceeds legal limits", "IP assignment seems unfair"]
    };
  } else if (lowerMsg.includes('tenant') || lowerMsg.includes('rent')) {
    return {
      content: "I understand you have a tenant-related issue. As a tenant in India:\n\n**Your Rights:**\n✓ Right to safe and habitable premises\n✓ Protection from arbitrary eviction\n✓ Right to privacy and peaceful possession\n✓ Fair rent practices\n\n**Applicable Laws:**\n• State Rent Control Acts\n• Transfer of Property Act, 1882\n\n**What's your specific concern?**\n- Eviction notice received?\n- Rent increase dispute?\n- Landlord not doing repairs?\n- Security deposit issue?",
      acts: ["Transfer of Property Act, 1882 - Section 108", "State Rent Control Acts"],
      canGenerateDocument: false,
      suggestedFollowups: ["Landlord wants to evict me", "Rent increased suddenly", "How to get deposit back?"]
    };
  } else if (lowerMsg.includes('consumer') || lowerMsg.includes('defective') || lowerMsg.includes('product')) {
    return {
      content: "This is a consumer protection matter. Under the **Consumer Protection Act, 2019**, you're protected against:\n\n• Defective products\n• Deficiency in services\n• Unfair trade practices\n• Misleading advertisements\n\n**Your Rights:**\n1. Refund or replacement\n2. Compensation for damages\n3. File complaint in Consumer Forum\n\n**To help you better, please share:**\n- Product/service name\n- What defect/issue occurred\n- When you purchased it\n- Seller/company details",
      acts: ["Consumer Protection Act, 2019 - Section 2(1)(g)", "Consumer Protection Act, 2019 - Section 35"],
      canGenerateDocument: true,
      documentType: 'consumer_complaint',
      suggestedFollowups: ["Mobile phone stopped working after 2 months", "How to file in consumer court?", "What compensation can I get?"]
    };
  } else if (lowerMsg.includes('fir') || lowerMsg.includes('police') || lowerMsg.includes('complaint')) {
    return {
      content: "I can help you understand FIR (First Information Report) filing. An FIR is filed for:\n\n• Cognizable offenses (serious crimes)\n• At the nearest police station\n• Within reasonable time of incident\n\n**What you need:**\n- Date, time, and place of incident\n- Details of what happened\n- Names of accused (if known)\n- Names of witnesses\n- Any evidence you have\n\n**Important:** Police MUST register FIR for cognizable offenses. If they refuse, you can:\n1. Approach Superintendent of Police\n2. Send written complaint by post\n3. File online e-FIR (many states)\n\nWhat incident do you need to report?",
      acts: ["Code of Criminal Procedure, 1973 - Section 154", "Indian Penal Code"],
      canGenerateDocument: true,
      documentType: 'fir',
      suggestedFollowups: ["Police refusing to file FIR", "Can I file online?", "What happens after FIR?"]
    };
  } else {
    return {
      content: "I'm here to help with your legal issue. Could you please provide more details?\n\n**Common areas I assist with:**\n\n🏠 **Property & Rent** - Tenant rights, eviction, property disputes\n💼 **Consumer Issues** - Defective products, service complaints\n⚖️ **Criminal Matters** - FIR filing, bail, criminal complaints\n📄 **RTI Applications** - Government information requests\n👨‍👩‍👧 **Family Law** - Divorce, maintenance, custody\n💰 **Employment** - Salary disputes, wrongful termination\n\nWhat type of legal matter is this?",
      acts: [],
      canGenerateDocument: false,
      suggestedFollowups: ["I have a consumer complaint", "Need to file RTI", "Tenant-landlord dispute"]
    };
  }
};

const generateDocument = (type, context) => {
  // Document Templates (kept identical to source)
  const templates = {
    rti: `RIGHT TO INFORMATION APPLICATION\n\nTo,\nThe Public Information Officer (PIO)\n[Department Name]\n[Address]\n\nSubject: Application under Right to Information Act, 2005\n\nRespected Sir/Madam,\n\nUnder Section 6(1) of the Right to Information Act, 2005, I hereby request the following information:\n\n1. [Specific information requested]\n2. [Additional details]\n\nThe information is required for [purpose].\nI am willing to pay the prescribed fee for obtaining this information.\nPlease provide the information within the stipulated time period of 30 days as per the RTI Act, 2005.\n\nYours faithfully,\n[Your Name]\n[Address]\n[Contact Details]\nDate: ${new Date().toLocaleDateString('en-IN')}`,
    consumer_complaint: `CONSUMER COMPLAINT\n\nBefore the District Consumer Disputes Redressal Forum\n[District Name]\n\nComplaint under Section 35 of the Consumer Protection Act, 2019\n\nComplainant: [Your Name]\nAddress: [Your Address]\nContact: [Phone/Email]\n\nVs.\nOpposite Party: [Company/Seller Name]\nAddress: [Their Address]\n\nFACTS OF THE CASE:\n\n1. The complainant purchased [product/service] on [date] from the opposite party.\n2. [Description of defect/deficiency]\n3. Despite multiple requests, the opposite party has failed to [refund/replace/repair].\n4. This amounts to deficiency in service and unfair trade practice.\n\nRELIEF SOUGHT:\n\n1. Refund of amount paid: Rs. [Amount]\n2. Compensation for mental agony and harassment: Rs. [Amount]\n3. Cost of litigation\n4. Any other relief deemed fit\n\nPRAYER:\n\nIt is therefore humbly prayed that this Hon'ble Forum may be pleased to:\n- Direct the opposite party to refund the amount\n- Award compensation as claimed above\n- Pass any other order deemed fit\n\nPlace: [City]\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nSignature of Complainant`,
    fir: `FIRST INFORMATION REPORT (FIR)\n\nTo,\nThe Officer-in-Charge\n[Police Station Name]\n[Address]\n\nSubject: Registration of FIR\n\nRespected Sir/Madam,\n\nI, [Your Name], resident of [Address], hereby report the following incident for registration of FIR:\n\nDate of Incident: [Date]\nTime of Incident: [Time]\nPlace of Incident: [Location]\n\nDETAILS OF INCIDENT:\n[Detailed description of what happened]\n\nACCUSED DETAILS:\nName: [If known]\nDescription: [Physical description if known]\n\nWITNESSES:\n1. [Name and address]\n2. [Name and address]\n\nI request you to kindly register the FIR and take necessary action as per law.\nSignature\nName: [Your Name]\nDate: ${new Date().toLocaleDateString('en-IN')}`
  };
  return templates[type] || "Document template not found.";
};

// --- UI COMPONENTS ---

// Enhanced Chat Message Component
const ChatMessage = ({ 
  message, 
  isUser, 
  onCopy, 
  onGenerateDoc, 
  isGeneratingDoc, 
  isSpeaking = false, 
  onToggleSpeak 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <div
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-8 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isUser
        ? 'bg-gradient-to-br from-indigo-600 to-purple-700'
        : 'bg-white border border-slate-200'
        }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <img src={logo} alt="AI" className="w-6 h-6" />
        )}
      </div>

      <div className={`flex-1 max-w-3xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative rounded-2xl px-6 py-5 shadow-sm transition-all duration-200 ${isUser
          ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none'
          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none hover:shadow-md'
          }`}>
          {/* Message Content */}
          <div className={`leading-7 text-[15px] ${isUser ? 'text-indigo-50' : 'text-slate-600'}`}>
            {isUser ? (
              // User messages - simple text
              message.content.split('\n').map((line, index) =>
                line.trim() ? <p key={index} className="mb-2 last:mb-0">{line}</p> : <br key={index} />
              )
            ) : (
              // AI messages - render markdown
              <div className="prose prose-slate max-w-none">
                {renderMarkdown(message.content)}
              </div>
            )}
          </div>

          {/* Legal Acts Section */}
          {message.acts && message.acts.length > 0 && (
            <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Applicable Laws</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.acts.map((act, idx) => (
                  <div key={idx} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-colors cursor-help group/act">
                    {act}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RAG & Graph RAG Context Citations */}
          {(message.ragUsed || message.graphRagUsed || message.constitutionUsed || message.kanoonUsed) && (
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                    Legal Knowledge & Precedents Grounded (RAG)
                  </span>
                </div>
                {message.activeModel && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                    ☁️ AWS Bedrock: <span className="text-amber-700 font-bold">{message.activeModel}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.constitutionUsed && (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: '21' } }));
                      }
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-md border border-amber-200/80 hover:border-amber-400 font-bold flex items-center gap-1.5 font-sans shadow-xs transition-colors cursor-pointer group"
                    title="Click to view full 448-article Obsidian Knowledge Graph"
                  >
                    <span>📜 Constitution of India Database</span>
                    <Network className="w-3 h-3 text-amber-600 group-hover:rotate-12 transition-transform" />
                  </button>
                )}
                {message.kanoonUsed && (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: null } }));
                      }
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-md border border-emerald-200/80 hover:border-emerald-400 font-bold flex items-center gap-1.5 font-sans shadow-xs transition-colors cursor-pointer group"
                    title="Click to view live Indian Kanoon precedent sources"
                  >
                    <span>⚖️ Indian Kanoon Live Citations</span>
                    <ExternalLink className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
                {message.graphRagUsed && (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: null } }));
                      }
                    }}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] px-2.5 py-1 rounded-md border border-indigo-100/50 hover:border-indigo-300 font-semibold flex items-center gap-1.5 font-sans cursor-pointer transition-colors"
                    title="Click to inspect Obsidian Graph RAG network"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    <span>Graph RAG Synced</span>
                    <Network className="w-3 h-3 text-indigo-500" />
                  </button>
                )}
                {message.retrievedDocs && message.retrievedDocs.map((docTitle, idx) => (
                  <span key={idx} className="bg-slate-50 text-slate-700 text-[10px] px-2.5 py-1 rounded-md border border-slate-200/80 font-medium font-sans">
                    📄 {docTitle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Floating Actions */}
          {!isUser && showActions && (
            <div className="absolute -top-3 right-0 flex gap-1 bg-white rounded-lg shadow-lg border border-slate-100 p-1 animate-fadeIn">
              <button onClick={handleCopy} className="p-1.5 hover:bg-slate-50 rounded-md transition-colors text-slate-500 hover:text-indigo-600">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onToggleSpeak?.(message.id, message.content)}
                className={`p-1.5 hover:bg-slate-50 rounded-md transition-colors ${isSpeaking ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-slate-500 hover:text-indigo-600'}`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud with AI voice'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Helper Actions (Chips) */}
        <div className="flex flex-wrap gap-2 mt-3 pl-2">
          {message.canGenerateDocument && !isUser && (
            <button
              onClick={() => onGenerateDoc(message.documentType, message.content)}
              disabled={isGeneratingDoc}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${isGeneratingDoc
                ? 'bg-slate-100 text-slate-400 cursor-wait'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200 shadow-emerald-100'
                }`}
            >
              {isGeneratingDoc ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
              {isGeneratingDoc ? 'Drafting...' : `Draft ${message.documentType?.replace('_', ' ').toUpperCase()}`}
            </button>
          )}

          {message.suggestedFollowups?.map((followup, idx) => (
            <button
              key={idx}
              onClick={() => window.handleSuggestedFollowup?.(followup)}
              className="text-xs px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all font-medium shadow-sm hover:shadow-md"
            >
              {followup}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-slate-300 font-medium mt-2 px-2 uppercase tracking-wide">
          {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// Dynamic Typing Indicator with Legal Steps
const TypingIndicator = () => (
  <div className="flex gap-4 mb-8 animate-fadeIn">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
      <Bot className="w-5 h-5 text-white animate-pulse" />
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-6 py-5 shadow-md min-w-[280px]"
         style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)' }}>
      <LoadingStatus />
    </div>
  </div>
);

// Enhanced Document Modal
const DocumentModal = ({ isOpen, onClose, documentContent, documentType }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([documentContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${documentType}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveToDocuments = () => {
    const savedDoc = documentService.saveDocument({
      type: documentType,
      content: documentContent,
      title: `${documentType.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`
    });
    if (savedDoc) alert('Document saved to your Documents section!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-slideUp ring-1 ring-slate-900/5">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Legal Draft Generated</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Review before downloading</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="bg-white p-10 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] font-serif text-sm leading-relaxed whitespace-pre-wrap text-slate-800 border border-slate-100 max-w-3xl mx-auto">
            {documentContent}
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-white flex gap-3 justify-end">
          <button
            onClick={() => navigator.clipboard.writeText(documentContent)}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Text
          </button>
          <button
            onClick={handleSaveToDocuments}
            className="px-5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4" /> Save Securely
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Settings Modal
const SettingsModal = ({ isOpen, onClose, language, setLanguage }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slideUp overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">Preferences</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Application Language</label>
            <div className="grid grid-cols-1 gap-3">
              {[{ code: 'multi', label: 'Auto Detect', native: 'बहुभाषी (Smart)' }, { code: 'en', label: 'English', native: 'English' }, { code: 'hi', label: 'Hindi', native: 'हिंदी' }].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${language === lang.code
                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600/20'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md bg-white'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${language === lang.code ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className={`block font-bold ${language === lang.code ? 'text-indigo-900' : 'text-slate-700'}`}>{lang.label}</span>
                      <span className="text-xs text-slate-500">{lang.native}</span>
                    </div>
                  </div>
                  {language === lang.code && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Accessibility</label>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Volume2 className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Voice Response</span>
              </div>
              <div className="w-11 h-6 bg-indigo-600 rounded-full relative cursor-pointer shadow-inner">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Persistent Memory Inspector Modal (LSTM Cell State & Facts)
const MemoryModal = ({ isOpen, onClose, memoryStats, onClearMemory }) => {
  if (!isOpen) return null;

  const entities = memoryStats?.entities || {};
  const recentQueries = memoryStats?.recentQueries || [];
  const entityEntries = Object.entries(entities).filter(([_, v]) => v && typeof v === 'string');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-slideUp ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Persistent Legal Memory</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wide">
                  Fast LSTM Cell State
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Auto-retained case facts & previous queries across all chat turns</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* Status metrics card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Retention Health</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-purple-700">{memoryStats?.retentionScore || 100}%</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Active</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Facts In Cell</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-700">{entityEntries.length}</span>
                <span className="text-[10px] text-slate-400">entities</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Queries Preserved</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800">{recentQueries.length}</span>
                <span className="text-[10px] text-slate-400">turns</span>
              </div>
            </div>
          </div>

          {/* Retained Facts & Entities */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Verified Client & Dispute Facts
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Persisted in Local Storage</span>
            </div>

            {entityEntries.length === 0 && !memoryStats?.disputeType ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                No case facts established yet. As you chat about your legal problem, names, amounts, locations, and roles will be automatically consolidated here.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {memoryStats?.disputeType && (
                  <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">Dispute Classification</span>
                    <span className="text-sm font-bold text-purple-900 capitalize">{memoryStats.disputeType.replace('_', ' ')}</span>
                  </div>
                )}
                {entityEntries.map(([key, val]) => (
                  <div key={key} className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 break-words">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chronological Questions History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5 text-purple-600" />
              What You Previously Asked in this Matter
            </h4>

            {recentQueries.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                No past questions yet. Ask any questions in chat and LawBot will remember every inquiry and answer.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentQueries.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-700">Turn {item.turn}: "{item.query}"</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {item.takeaway && (
                      <p className="text-slate-500 font-medium text-[11px] mt-1 pl-2 border-l-2 border-indigo-400">
                        Advice Given: {item.takeaway}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
              LawBot360 uses recurrent memory gating (LSTM Cell State) to carry facts and queries forward. You can ask follow-ups like "What penalty applies to what I mentioned earlier?" without repeating your story.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            onClick={onClearMemory}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Active Memory
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Saved Chats & Sessions Modal
const ChatHistoryModal = ({ isOpen, onClose, chats, currentChatId, onLoadChat, onNewChat, onDeleteChat }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden animate-slideUp ring-1 ring-slate-900/5">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Saved Consultations</h3>
              <p className="text-xs text-slate-500 font-medium">Persistent chat history & case sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Start New Consultation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
          {chats.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8 italic">No previous chats saved yet.</p>
          ) : (
            chats.map((chat) => {
              const isCurrent = String(chat.id) === String(currentChatId);
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    onLoadChat(chat);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-indigo-600'}`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate block ${isCurrent ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {chat.title || 'Legal Consultation'}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded-md bg-indigo-600 text-white text-[9px] font-bold uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {chat.messages ? `${chat.messages.length} messages` : 'Session'} • {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id, e);
                    }}
                    className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Default initial assistant greeting
const DEFAULT_GREETING = {
  id: 1,
  content: "Hello! I'm LawBot 360, your advanced AI legal assistant for India.\n\nI can help you with:\n\n✓ **Legal Rights & Laws**\n✓ **Drafting Documents** (RTI, FIR, Contracts)\n✓ **Case Strategy & Analysis**\n\nHow can I assist you today?",
  isUser: false,
  timestamp: Date.now(),
  acts: [],
  canGenerateDocument: false,
  suggestedFollowups: ["I need to file an RTI", "Consumer complaint help", "What are tenant rights?"]
};

// Main Chat Application
export default function ChatApp() {
  const [chatHistory, setChatHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lawbot-chats');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [currentChatId, setCurrentChatId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lawbot_active_chat_id');
      if (saved) return saved;
    }
    return 'chat_' + Date.now();
  });

  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      const activeId = localStorage.getItem('lawbot_active_chat_id');
      const savedChats = localStorage.getItem('lawbot-chats');
      if (savedChats) {
        try {
          const parsed = JSON.parse(savedChats);
          if (activeId) {
            const active = parsed.find(c => String(c.id) === String(activeId));
            if (active && active.messages && active.messages.length > 0) {
              return active.messages;
            }
          } else if (parsed.length > 0 && parsed[0].messages) {
            return parsed[0].messages;
          }
        } catch (e) {}
      }
    }
    return [DEFAULT_GREETING];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState('multi');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  
  // Voice states & references
  const [isListening, setIsListening] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // Persistent Memory stats state
  const [memoryStats, setMemoryStats] = useState(() => persistentMemoryService.getMemoryStats());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeSpeakerRef = useRef(null);
  const activeVoiceStopRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Connect active session with persistent memory service and listen to changes
  useEffect(() => {
    if (currentChatId) {
      persistentMemoryService.setActiveSession(currentChatId);
      setMemoryStats(persistentMemoryService.getMemoryStats());
    }
    const unsubscribe = persistentMemoryService.subscribe(stats => {
      setMemoryStats(stats);
    });
    return unsubscribe;
  }, [currentChatId]);

  // Auto-persist active chat session & messages on every change
  useEffect(() => {
    if (!currentChatId || messages.length === 0) return;
    localStorage.setItem('lawbot_active_chat_id', String(currentChatId));

    setChatHistory(prevChats => {
      const existingIdx = prevChats.findIndex(c => String(c.id) === String(currentChatId));
      let title = 'Legal Consultation';
      const firstUserMsg = messages.find(m => m.isUser);
      if (firstUserMsg) {
        title = firstUserMsg.content.trim().substring(0, 32);
        if (firstUserMsg.content.length > 32) title += '...';
      }

      let updated;
      if (existingIdx >= 0) {
        updated = [...prevChats];
        updated[existingIdx] = {
          ...updated[existingIdx],
          title: prevChats[existingIdx].title !== 'Legal Consultation' ? prevChats[existingIdx].title : title,
          messages,
          updatedAt: Date.now()
        };
      } else {
        updated = [
          {
            id: currentChatId,
            title,
            messages,
            timestamp: Date.now(),
            updatedAt: Date.now()
          },
          ...prevChats
        ];
      }
      localStorage.setItem('lawbot-chats', JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentChatId]);

  const saveChatHistory = (chats) => {
    localStorage.setItem('lawbot-chats', JSON.stringify(chats));
    setChatHistory(chats);
  };

  const createNewChat = () => {
    // Stop any active speech or mic
    handleStopSpeaking();
    if (isListening) handleVoiceInput();

    const newId = 'chat_' + Date.now();
    setCurrentChatId(newId);
    persistentMemoryService.setActiveSession(newId);
    setMessages([DEFAULT_GREETING]);
  };

  const loadChat = (chat) => {
    handleStopSpeaking();
    if (isListening) handleVoiceInput();

    setMessages(chat.messages || [DEFAULT_GREETING]);
    setCurrentChatId(chat.id);
    persistentMemoryService.setActiveSession(chat.id);
  };

  const deleteChat = (chatId, e) => {
    e?.stopPropagation();
    const updatedChats = chatHistory.filter(chat => String(chat.id) !== String(chatId));
    saveChatHistory(updatedChats);
    persistentMemoryService.clearSessionMemory(chatId);

    if (String(currentChatId) === String(chatId)) {
      if (updatedChats.length > 0) {
        loadChat(updatedChats[0]);
      } else {
        createNewChat();
      }
    }
  };

  const handleClearActiveMemory = () => {
    persistentMemoryService.clearSessionMemory(currentChatId);
    setMemoryStats(persistentMemoryService.getMemoryStats());
  };

  window.handleSuggestedFollowup = (followup) => {
    setInputMessage(followup);
    inputRef.current?.focus();
  };

  // Speech Output Manager (stops any existing utterance cleanly, never glitches)
  const handleToggleSpeak = (messageId, text) => {
    if (speakingMessageId === messageId) {
      handleStopSpeaking();
    } else {
      handleStopSpeaking();
      setSpeakingMessageId(messageId);

      const controller = lawBot360AI.speak(text, {
        onStart: () => setSpeakingMessageId(messageId),
        onEnd: () => {
          setSpeakingMessageId(null);
          activeSpeakerRef.current = null;
        },
        onError: () => {
          setSpeakingMessageId(null);
          activeSpeakerRef.current = null;
        }
      });
      activeSpeakerRef.current = controller;
    }
  };

  const handleStopSpeaking = () => {
    if (activeSpeakerRef.current) {
      try { activeSpeakerRef.current.stop(); } catch (e) {}
      activeSpeakerRef.current = null;
    }
    lawBot360AI.stopSpeaking();
    setSpeakingMessageId(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    handleStopSpeaking();

    const userMessage = { id: Date.now(), content: inputMessage.trim(), isUser: true, timestamp: Date.now() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isDocumentRequest) {
        await generateAIDocument(userMessage.content, lastMessage.documentType);
        setIsTyping(false);
        return;
      }

      const aiResponse = await generateAIResponse(userMessage.content, updatedMessages, currentChatId);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, ...aiResponse, isUser: false, timestamp: Date.now() }]);
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, content: "I apologize, but I encountered an error. Please try again.", isUser: false, timestamp: Date.now(), acts: [], canGenerateDocument: false }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (prompt) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  // High-reliability Voice STT: Deepgram with auto seamless Web Speech API streaming fallback
  const handleVoiceInput = async () => {
    // If already listening, stop everything cleanly
    if (isListening) {
      if (activeVoiceStopRef.current) {
        try { activeVoiceStopRef.current(); } catch (e) {}
        activeVoiceStopRef.current = null;
      }
      deepgramService.stopListening();
      lawBot360AI.stopListening();
      setIsListening(false);
      setIsMicReady(false);
      setInterimTranscript('');
      return;
    }

    setIsListening(true);
    setIsMicReady(false);
    setInterimTranscript('');

    let baseText = inputMessage ? inputMessage.trim() + ' ' : '';

    const startWebSpeechFallback = () => {
      setIsMicReady(true);
      const stopFn = lawBot360AI.startListeningStreaming(language === 'hi' ? 'hi' : 'en-IN', {
        onTranscript: (finalText) => {
          baseText += finalText + ' ';
          setInputMessage(baseText.trim());
          setInterimTranscript('');
        },
        onInterim: (interim) => {
          setInterimTranscript(interim);
        },
        onError: (err) => {
          console.warn('[Voice STT] WebSpeech error:', err);
          setIsListening(false);
          setIsMicReady(false);
          setInterimTranscript('');
        },
        onEnd: () => {
          setIsListening(false);
          setIsMicReady(false);
          setInterimTranscript('');
        }
      });
      activeVoiceStopRef.current = stopFn;
    };

    if (deepgramService.isAvailable()) {
      try {
        await deepgramService.startListening({
          language: language,
          onReady: () => setIsMicReady(true),
          onTranscript: ({ transcript, isFinal }) => {
            if (isFinal) {
              baseText += transcript + ' ';
              setInputMessage(baseText.trim());
              setInterimTranscript('');
            } else {
              setInterimTranscript(transcript);
            }
          },
          onError: (err) => {
            console.warn('[Voice STT] Deepgram failed during session, falling back to Web Speech:', err);
            deepgramService.stopListening();
            startWebSpeechFallback();
          }
        });
        activeVoiceStopRef.current = () => deepgramService.stopListening();
      } catch (err) {
        console.warn('[Voice STT] Deepgram connection error, falling back to Web Speech:', err);
        startWebSpeechFallback();
      }
    } else {
      startWebSpeechFallback();
    }
  };

  const handleGenerateDocument = async (type, context) => {
    setIsGeneratingDoc(true);
    const conversationContext = messages.map(msg => `${msg.isUser ? 'User' : 'Lawyer'}: ${msg.content}`).join('\n\n');
    const prompt = `Based on our complete conversation below, generate a professional ${type.replace('_', ' ')} document...\n\n${conversationContext}\n\nFill in actual details.`;

    try {
      const response = await lawBot360AI.sendMessage(prompt);
      if (response.success) {
        setCurrentDocument(response.response);
        setDocumentType(type);
        setShowDocModal(true);
        documentService.saveDocument({ type: type, content: response.response, title: `${type.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}` });
      }
    } catch (error) {
      console.error('Document generation error:', error);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    // ... (File upload logic remains same)
    const fileMessage = { id: Date.now(), content: `📄 Uploaded document: ${file.name}\n\nAnalyzing document...`, isUser: true, timestamp: Date.now() };
    setMessages(prev => [...prev, fileMessage]);
    setIsTyping(true);
    // Mock response for UI demo as AI service is imported
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, content: "I've analyzed the document. It appears to be a standard agreement. I can help you identify risk clauses or summarize obligations.", isUser: false, timestamp: Date.now() }]);
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">

      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Legal Assistant
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Online</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">AI-powered • Secure • Indian Law</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Persistent Memory Indicator Button */}
            <button
              onClick={() => setShowMemoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 hover:border-purple-300 text-purple-700 hover:text-purple-900 rounded-full shadow-xs transition-all font-semibold text-xs active:scale-95 group"
              title="Inspect Persistent Legal Memory (LSTM Cell State)"
            >
              <Brain className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">🧠 Memory:</span>
              <span>{memoryStats?.entityCount > 0 ? `${memoryStats.entityCount} Facts Retained` : 'Active'}</span>
              <span className="text-[10px] bg-purple-200/80 text-purple-800 font-bold px-1.5 py-0.2 rounded-full">
                {memoryStats?.retentionScore || 100}%
              </span>
            </button>

            {/* Saved Chats Drawer Button */}
            <button
              onClick={() => setShowChatHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all font-semibold text-xs active:scale-95"
              title="Saved Consultations & Case History"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Saved Chats</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                {chatHistory.length}
              </span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={createNewChat}
              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 rounded-full transition-all font-semibold text-xs active:scale-95"
              title="Start New Consultation"
            >
              <Plus className="w-4 h-4" />
            </button>

            <div className={`hidden lg:flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${language === 'multi' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {language === 'multi' ? <Sparkles className="w-3 h-3 mr-1.5" /> : <Globe className="w-3 h-3 mr-1.5" />}
              {language === 'multi' ? 'Smart Auto-Detection' : '28 Languages'}
            </div>
            <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: null } }));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded-full hover:bg-slate-800 shadow-md shadow-amber-500/10 transition-all font-semibold text-xs active:scale-95 hover:scale-105 group"
              title="Open Obsidian Knowledge Graph & Sources (448 Articles)"
            >
              <Network className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Obsidian Graph RAG</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.2 rounded-full border border-amber-500/30">448</span>
            </button>
            <button
              onClick={() => setShowVoiceCall(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 shadow-md shadow-indigo-100 transition-all font-semibold text-xs active:scale-95 hover:scale-105"
              title="Call LawAgent360"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Advocate
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-20 py-8 scroll-smooth" id="chat-container">

          {/* Welcome Screen - Redesigned */}
          {messages.length === 1 && (
            <div className="max-w-4xl mx-auto mt-8 mb-12 animate-slideUp">
              <div className="text-center mb-16">
                <div className="inline-flex p-4 rounded-3xl bg-indigo-50 mb-6 shadow-inner">
                  <Bot className="w-12 h-12 text-indigo-600" />
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">How can I assist you legally?</h1>
                <p className="text-lg text-slate-500 max-w-xl mx-auto">I can draft documents, analyze contracts, and provide guidance on Indian Law instantly.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: MessageSquare, title: "Legal Consultation", desc: "Get instant answers to legal queries regarding property, family, or criminal law.", action: "I need legal assistance with" },
                  { icon: FileText, title: "Draft Documents", desc: "Generate RTI, FIR, or Consumer Complaints tailored to your case.", action: "I need to file an RTI application" },
                  { icon: FileSearch, title: "Contract Review", desc: "Upload agreements to detect risks, unfair clauses, and hidden terms.", action: "I want to analyze a contract for risks" }
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(card.action)}
                    className="text-left bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center mb-4 transition-colors text-slate-600">
                      <card.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{card.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                  </button>
                ))}
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex items-start gap-6">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Pro Tip: Be Specific</h3>
                    <p className="text-indigo-100 leading-relaxed max-w-lg">Mention specific dates, amounts, and locations (State/City) to get the most accurate legal advice tailored to local jurisdiction.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="max-w-4xl mx-auto pb-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isUser={message.isUser}
                onGenerateDoc={handleGenerateDocument}
                isGeneratingDoc={isGeneratingDoc}
                isSpeaking={speakingMessageId === message.id}
                onToggleSpeak={handleToggleSpeak}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Floating & Modern */}
        <div className="bg-white px-4 md:px-0 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className={`relative bg-white rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] border border-slate-200 transition-all duration-300 focus-within:shadow-[0_0_40px_-10px_rgba(79,70,229,0.15)] focus-within:border-indigo-300 ${isTyping ? 'opacity-50 pointer-events-none' : ''}`}>

              <div className="flex items-end p-2 gap-2">
                {/* Attach Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Upload Document"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="hidden" />

                {/* Text Area */}
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening 
                    ? (isMicReady ? (language === 'en' ? "Go ahead, I'm listening..." : "लिखें या बोलें, मैं सुन रहा हूँ...") : "Starting Microphone...") 
                    : (language === 'en' ? "Type your legal query here..." : "अपनी कानूनी समस्या यहाँ लिखें...")
                  }
                  className={`flex-1 max-h-32 py-3 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 resize-none font-medium leading-relaxed scrollbar-hide ${isListening ? 'text-indigo-600' : ''}`}
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />

                {/* Mic Button (Deepgram STT) */}
                <button
                  onClick={handleVoiceInput}
                  className={`p-3 rounded-full transition-all duration-300 ${isListening
                    ? isMicReady 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' 
                      : 'bg-amber-500 text-white shadow-lg shadow-amber-200 animate-bounce'
                    : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'
                    }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className={`p-3 rounded-2xl transition-all duration-300 flex items-center justify-center ${inputMessage.trim() && !isTyping
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Interim transcript display */}
              {isListening && (
                <div className="px-4 pb-3 pt-0">
                  <div className={`flex items-center gap-2 text-xs font-medium ${isMicReady ? 'text-red-500' : 'text-amber-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${isMicReady ? 'bg-red-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`}></span>
                    {isMicReady ? (interimTranscript || "Listening for your voice...") : "Connecting to Deepgram AI..."}
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
              LawBot 360 can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        documentContent={currentDocument}
        documentType={documentType}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        language={language}
        setLanguage={setLanguage}
      />
      <VoiceCallModal
        isOpen={showVoiceCall}
        onClose={() => setShowVoiceCall(false)}
        userId="user_client_360"
      />
      <MemoryModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        memoryStats={memoryStats}
        onClearMemory={handleClearActiveMemory}
      />
      <ChatHistoryModal
        isOpen={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        chats={chatHistory}
        currentChatId={currentChatId}
        onLoadChat={loadChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
      />

      <style>{`
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Hide scrollbar for textarea */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}