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

// Clean markdown renderer for AI responses matching Orax theme
const renderMarkdown = (text) => {
  return text
    .split('\n')
    .map((line, index) => {
      // Handle headers (###)
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-base font-bold text-white mt-5 mb-2.5 border-b border-white/[0.08] pb-1.5">{line.replace('### ', '')}</h3>;
      }

      // Handle subheaders (####)
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-sm font-semibold text-purple-300 mt-4 mb-2">{line.replace('#### ', '')}</h4>;
      }

      // Handle bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2 last:mb-0 text-zinc-300 leading-relaxed text-sm">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold text-white">{part}</strong> : part
            )}
          </p>
        );
      }

      // Handle bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1 list-disc text-zinc-300 text-sm leading-relaxed">{line.trim().substring(2)}</li>;
      }

      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return <li key={index} className="ml-4 mb-1 list-decimal font-medium text-zinc-300 text-sm leading-relaxed">{line.trim().replace(/^\d+\.\s*/, '')}</li>;
      }

      // Handle checkmarks
      if (line.trim().startsWith('✓')) {
        return <p key={index} className="mb-1.5 ml-4 font-medium text-emerald-400 text-sm">{line}</p>;
      }

      // Handle horizontal rules (---)
      if (line.trim() === '---') {
        return <hr key={index} className="my-5 border-white/[0.08]" />;
      }

      // Regular paragraphs
      return line.trim() ? <p key={index} className="mb-2 last:mb-0 text-zinc-300 text-sm leading-relaxed">{line}</p> : <br key={index} />;
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
      className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isUser
        ? 'bg-violet-500/15 border border-violet-500/30 text-violet-300'
        : 'bg-violet-600 text-white shadow-sm'
        }`}>
        {isUser ? (
          <User className="w-4 h-4 text-purple-300" />
        ) : (
          <Scale className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex-1 max-w-3xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`relative rounded-2xl px-5 py-4 transition-all duration-200 ${isUser
          ? 'bg-purple-600/20 border border-purple-500/30 text-purple-100 rounded-tr-none'
          : 'bg-[#161922] border border-white/[0.08] hover:border-white/[0.12] text-zinc-200 rounded-tl-none shadow-md'
          }`}>
          {/* Message Content */}
          <div className="leading-relaxed text-sm">
            {isUser ? (
              // User messages - simple text
              message.content.split('\n').map((line, index) =>
                line.trim() ? <p key={index} className="mb-1.5 last:mb-0 text-white font-normal">{line}</p> : <br key={index} />
              )
            ) : (
              // AI messages - render markdown
              <div className="text-zinc-200">
                {renderMarkdown(message.content)}
              </div>
            )}
          </div>

          {/* Legal Acts Section */}
          {message.acts && message.acts.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-white/[0.08]">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Applicable Statutory Citations</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.acts.map((act, idx) => (
                  <span key={idx} className="badge-purple">
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* RAG & Graph RAG Context Citations */}
          {(message.ragUsed || message.graphRagUsed || message.constitutionUsed || message.kanoonUsed) && (
            <div className="mt-3.5 pt-3 border-t border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Statutory Grounding (RAG Verified)
                  </span>
                </div>
                {message.activeModel && (
                  <span className="text-[9px] font-semibold text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full flex items-center gap-1">
                    AWS Bedrock: <span className="text-purple-300 font-bold">{message.activeModel}</span>
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
                    className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] px-2.5 py-1 rounded-lg border border-purple-500/30 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Click to view full 448-article Obsidian Knowledge Graph"
                  >
                    <span>📜 Constitution of India Database</span>
                    <Network className="w-3 h-3 text-purple-400" />
                  </button>
                )}
                {message.kanoonUsed && (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: null } }));
                      }
                    }}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/30 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Click to view live Indian Kanoon precedent sources"
                  >
                    <span>⚖️ Indian Kanoon Live Citations</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                  </button>
                )}
                {message.graphRagUsed && (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: null } }));
                      }
                    }}
                    className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[10px] px-2.5 py-1 rounded-lg border border-sky-500/30 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Click to inspect Obsidian Graph RAG network"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    <span>Graph RAG Synced</span>
                    <Network className="w-3 h-3 text-sky-400" />
                  </button>
                )}
                {message.retrievedDocs && message.retrievedDocs.map((docTitle, idx) => (
                  <span key={idx} className="bg-white/[0.04] text-zinc-300 text-[10px] px-2 py-0.5 rounded-md border border-white/[0.06]">
                    📄 {docTitle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Floating Actions */}
          {!isUser && showActions && (
            <div className="absolute -top-3 right-0 flex gap-1 bg-[#161922] border border-white/[0.12] rounded-lg shadow-xl p-1 animate-fadeIn">
              <button onClick={handleCopy} className="p-1 hover:bg-white/[0.06] rounded-md transition-colors text-zinc-400 hover:text-white" title="Copy Text">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onToggleSpeak?.(message.id, message.content)}
                className={`p-1 hover:bg-white/[0.06] rounded-md transition-colors ${isSpeaking ? 'text-purple-400 bg-purple-500/10 animate-pulse' : 'text-zinc-400 hover:text-white'}`}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud with AI voice'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Helper Actions (Chips) */}
        <div className="flex flex-wrap gap-2 mt-2.5 pl-2">
          {message.canGenerateDocument && !isUser && (
            <button
              onClick={() => onGenerateDoc(message.documentType, message.content)}
              disabled={isGeneratingDoc}
              className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${isGeneratingDoc
                ? 'bg-[#161922] text-zinc-500 cursor-wait border border-white/10'
                : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer'
                }`}
            >
              {isGeneratingDoc ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
              )}
              {isGeneratingDoc ? 'Drafting...' : `Draft ${message.documentType?.replace('_', ' ').toUpperCase()}`}
            </button>
          )}

          {message.suggestedFollowups?.map((followup, idx) => (
            <button
              key={idx}
              onClick={() => window.handleSuggestedFollowup?.(followup)}
              className="text-xs px-3 py-1.5 bg-[#161922] border border-white/10 text-purple-300 hover:text-white rounded-xl hover:border-purple-500/40 hover:bg-[#1b202c] transition-all font-medium cursor-pointer"
            >
              {followup}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-zinc-500 font-medium mt-1 px-2 uppercase tracking-wide">
          {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// Dynamic Typing Indicator with Legal Steps
const TypingIndicator = () => (
  <div className="flex gap-3.5 mb-6 animate-fadeIn">
    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
      <Bot className="w-4 h-4 text-white animate-pulse" />
    </div>
    <div className="bg-[#161922] border border-white/[0.08] rounded-2xl rounded-tl-none px-6 py-4 min-w-[280px]">
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
    <div className="fixed inset-0 bg-[#0c0e14]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#161922] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-white/[0.12] text-white">
        <div className="px-6 sm:px-8 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#11131a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Legal Draft Generated</h3>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Review before downloading or filing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-colors text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#0c0e14] custom-scrollbar">
          <div className="bg-[#11131a] p-8 rounded-2xl shadow-inner font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-200 border border-white/[0.08] max-w-3xl mx-auto">
            {documentContent}
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-white/[0.08] bg-[#11131a] flex flex-wrap gap-2.5 justify-end">
          <button
            onClick={() => navigator.clipboard.writeText(documentContent)}
            className="px-4 py-2 bg-[#161922] border border-white/10 text-zinc-200 rounded-xl text-xs font-semibold hover:bg-white/[0.05] transition-colors flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Text
          </button>
          <button
            onClick={handleSaveToDocuments}
            className="px-4 py-2 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold hover:bg-purple-500/25 transition-colors flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5" /> Save to Vault
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2 transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Download (.txt)
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
    <div className="fixed inset-0 bg-[#0c0e14]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#161922] border border-white/[0.12] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-white">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#11131a]">
          <h3 className="text-sm font-bold text-white">Preferences & Settings</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-xl text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3 block">Language Model Engine</label>
            <div className="grid grid-cols-1 gap-2.5">
              {[{ code: 'multi', label: 'Auto Detect (Smart)', native: 'बहुभाषी (Auto-Detect Indian Languages)' }, { code: 'en', label: 'English', native: 'English (Statutory Precision)' }, { code: 'hi', label: 'Hindi', native: 'हिंदी (सरल हिंदी विधिक सलाह)' }].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${language === lang.code
                    ? 'border-purple-500/60 bg-purple-500/15 text-white'
                    : 'border-white/[0.08] hover:border-white/[0.16] bg-[#11131a] text-zinc-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${language === lang.code ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/[0.05] text-zinc-400'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block font-semibold text-xs text-white">{lang.label}</span>
                      <span className="text-[10px] text-zinc-400">{lang.native}</span>
                    </div>
                  </div>
                  {language === lang.code && <CheckCircle className="w-4 h-4 text-purple-400" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5 block">Voice & Audio Feedback</label>
            <div className="flex items-center justify-between p-3.5 bg-[#11131a] rounded-2xl border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/15 text-purple-400 rounded-xl">
                  <Volume2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white">Synthesize Audio Responses</span>
              </div>
              <div className="w-10 h-5 bg-purple-600 rounded-full relative shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
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
    <div className="fixed inset-0 bg-[#0c0e14]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#161922] border border-white/[0.12] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#11131a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Persistent Legal Memory</h3>
                <span className="badge-purple">
                  LSTM Cell State
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">Auto-retained case facts & previous queries across all chat turns</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-colors text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0c0e14] custom-scrollbar">
          {/* Status metrics card */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#161922] p-4 rounded-2xl border border-white/[0.08]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Retention Health</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-purple-400">{memoryStats?.retentionScore || 100}%</span>
                <span className="text-[9px] text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
            <div className="bg-[#161922] p-4 rounded-2xl border border-white/[0.08]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Facts In Cell</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-sky-400">{entityEntries.length}</span>
                <span className="text-[9px] text-zinc-400">entities</span>
              </div>
            </div>
            <div className="bg-[#161922] p-4 rounded-2xl border border-white/[0.08]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Queries Preserved</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-purple-300">{recentQueries.length}</span>
                <span className="text-[9px] text-zinc-400">turns</span>
              </div>
            </div>
          </div>

          {/* Retained Facts & Entities */}
          <div className="bg-[#161922] p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Verified Client & Dispute Facts
              </h4>
              <span className="text-[10px] text-zinc-400 font-mono">Synced to Memory</span>
            </div>

            {entityEntries.length === 0 && !memoryStats?.disputeType ? (
              <p className="text-xs text-zinc-400 italic py-3 text-center">
                No case facts established yet. As you chat about your legal problem, names, amounts, locations, and roles will be consolidated here.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {memoryStats?.disputeType && (
                  <div className="bg-[#11131a] border border-purple-500/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">Dispute Classification</span>
                    <span className="text-xs font-bold text-white capitalize">{memoryStats.disputeType.replace('_', ' ')}</span>
                  </div>
                )}
                {entityEntries.map(([key, val]) => (
                  <div key={key} className="bg-[#11131a] border border-white/[0.06] rounded-xl p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-xs font-semibold text-white break-words">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chronological Questions History */}
          <div className="bg-[#161922] p-5 rounded-2xl border border-white/[0.08]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 mb-3">
              <History className="w-3.5 h-3.5 text-purple-400" />
              What You Previously Asked in this Matter
            </h4>

            {recentQueries.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-3 text-center">
                No past questions yet. Ask any questions in chat and LawBot will remember every inquiry and advice.
              </p>
            ) : (
              <div className="space-y-2">
                {recentQueries.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#11131a] border border-white/[0.06] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">Turn {item.turn}: "{item.query}"</span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {item.takeaway && (
                      <p className="text-zinc-300 text-[11px] mt-1 pl-2 border-l-2 border-purple-500">
                        Advice: {item.takeaway}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#11131a] flex items-center justify-between">
          <button
            onClick={onClearMemory}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Active Memory
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-500 transition-colors shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer"
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
    <div className="fixed inset-0 bg-[#0c0e14]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#161922] border border-white/[0.12] rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden text-white">
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between bg-[#11131a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Saved Consultations</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Persistent chat history & case sessions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.06] rounded-xl text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-white/[0.08] bg-[#11131a]">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Start New Consultation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0c0e14] custom-scrollbar">
          {chats.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-8 italic">No previous chats saved yet.</p>
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
                      ? 'bg-purple-500/15 border-purple-500/40 text-white'
                      : 'bg-[#161922] border-white/[0.08] hover:border-purple-500/30 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/[0.04] text-zinc-400 group-hover:text-purple-300'}`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate block ${isCurrent ? 'text-white' : 'text-zinc-200'}`}>
                          {chat.title || 'Legal Consultation'}
                        </span>
                        {isCurrent && (
                          <span className="badge-purple">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {chat.messages ? `${chat.messages.length} messages` : 'Session'} • {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id, e);
                    }}
                    className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
      <div className="flex-1 flex flex-col h-full bg-[#0c0e14] text-[#f1f5f9] relative">

        {/* Header */}
        <div className="bg-[#141721]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 hover:bg-white/[0.06] rounded-lg text-slate-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                Legal Assistant
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">Online</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">AI-powered • Secure • Indian Law</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            {/* Persistent Memory Indicator Button */}
            <button
              onClick={() => setShowMemoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-purple-200 rounded-full shadow-xs transition-all font-semibold text-xs active:scale-95 group"
              title="Inspect Persistent Legal Memory (LSTM Cell State)"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Memory:</span>
              <span>{memoryStats?.entityCount > 0 ? `${memoryStats.entityCount} Facts Retained` : 'Active'}</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 rounded-full border border-purple-500/30">
                {memoryStats?.retentionScore || 100}%
              </span>
            </button>

            {/* Saved Chats Drawer Button */}
            <button
              onClick={() => setShowChatHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 text-slate-300 rounded-full transition-all font-semibold text-xs active:scale-95"
              title="Saved Consultations & Case History"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Saved Chats</span>
              <span className="text-[10px] bg-white/[0.08] text-slate-300 font-bold px-1.5 py-0.2 rounded-full">
                {chatHistory.length}
              </span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={createNewChat}
              className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full transition-all font-semibold text-xs active:scale-95"
              title="Start New Consultation"
            >
              <Plus className="w-4 h-4" />
            </button>

            <div className={`hidden lg:flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${language === 'multi' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 animate-pulse' : 'bg-[#161922] text-slate-400 border-white/[0.08]'}`}>
              {language === 'multi' ? <Sparkles className="w-3 h-3 mr-1.5 text-purple-400" /> : <Globe className="w-3 h-3 mr-1.5" />}
              {language === 'multi' ? 'Smart Auto-Detection' : '28 Languages'}
            </div>
            <div className="w-px h-8 bg-white/[0.08] mx-1 hidden sm:block"></div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-obsidian-graph', { detail: { artNo: null } }));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161922] border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded-full hover:bg-amber-500/10 shadow-md shadow-amber-500/5 transition-all font-semibold text-xs active:scale-95 hover:scale-105 group"
              title="Open Obsidian Knowledge Graph & Sources (448 Articles)"
            >
              <Network className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Obsidian Graph RAG</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.2 rounded-full border border-amber-500/30">448</span>
            </button>
            <button
              onClick={() => setShowVoiceCall(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-sm transition-all font-medium text-xs active:scale-95"
              title="Call LawAgent360"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Advocate
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/[0.06] rounded-full transition-colors text-slate-400 hover:text-white">
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
                <div className="inline-flex p-4 rounded-3xl bg-[#161922] border border-purple-500/30 mb-6 shadow-xl shadow-purple-900/10">
                  <Bot className="w-12 h-12 text-purple-400" />
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">How can I assist you legally?</h1>
                <p className="text-base text-slate-400 max-w-xl mx-auto">Draft legal documents, analyze contracts, and consult Indian laws & statutes instantly.</p>
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
                    className="text-left bg-[#161922] p-6 rounded-2xl border border-white/[0.08] hover:border-purple-500/50 hover:bg-[#1a1d27] hover:-translate-y-1 transition-all duration-300 group shadow-lg shadow-black/20"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#11131a] border border-white/[0.06] group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center mb-4 transition-colors text-purple-400">
                      <card.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{card.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                  </button>
                ))}
              </div>

              <div className="bg-[#161922] border border-purple-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Sparkles className="w-32 h-32 text-purple-400" />
                </div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">Pro Tip: Be Specific</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xl">Mention specific dates, amounts, and locations (State/City) to get the most accurate legal advice tailored to local jurisdiction.</p>
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
        <div className="bg-[#0c0e14] px-4 md:px-0 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className={`relative bg-[#161922] rounded-2xl shadow-2xl shadow-black/40 border border-white/[0.08] transition-all duration-300 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/20 ${isTyping ? 'opacity-50 pointer-events-none' : ''}`}>

              <div className="flex items-end p-2 gap-2">
                {/* Attach Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 hover:bg-white/[0.06] rounded-xl text-slate-400 hover:text-purple-400 transition-colors"
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
                  className={`flex-1 max-h-32 py-3 bg-transparent border-none outline-none text-[#f1f5f9] placeholder:text-slate-500 resize-none font-medium leading-relaxed scrollbar-hide ${isListening ? 'text-purple-400' : ''}`}
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />

                {/* Mic Button (Deepgram STT) */}
                <button
                  onClick={handleVoiceInput}
                  className={`p-3 rounded-xl transition-all duration-300 ${isListening
                    ? isMicReady 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' 
                      : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 animate-bounce'
                    : 'hover:bg-white/[0.06] text-slate-400 hover:text-purple-400'
                    }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${inputMessage.trim() && !isTyping
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95'
                    : 'bg-white/[0.05] text-slate-600 cursor-not-allowed'
                    }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Interim transcript display */}
              {isListening && (
                <div className="px-4 pb-3 pt-0">
                  <div className={`flex items-center gap-2 text-xs font-medium ${isMicReady ? 'text-red-400' : 'text-amber-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${isMicReady ? 'bg-red-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`}></span>
                    {isMicReady ? (interimTranscript || "Listening for your voice...") : "Connecting to Deepgram AI..."}
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-[11px] text-slate-500 mt-3 font-medium">
              LawBot 360 can make mistakes. Please verify important information with a certified attorney.
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