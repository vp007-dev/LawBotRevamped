import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Loader,
  AlertCircle,
  FileText,
  Scale,
  MessageSquare
} from 'lucide-react';
import lawBot360AI from '../services/aiService';
import deepgramService from '../services/deepgramService';
import LoadingStatus from './LoadingStatus';

const AIChat = ({ isOpen, onClose }) => {
  const activeSpeakerRef = useRef(null);
  const activeVoiceStopRef = useRef(null);

  // Initialize messages with persistent storage
  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lawbot-modal-chat-messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
          }
        } catch (e) {}
      }
    }
    return [
      {
        id: 1,
        type: 'ai',
        content: "Hello! I'm LawBot360, your AI legal assistant. I can help you with Indian law queries, document generation, and legal guidance. How can I assist you today?",
        timestamp: new Date()
      }
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist modal messages
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem('lawbot-modal-chat-messages', JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await lawBot360AI.sendMessage(userMessage.content, {
        conversationHistory: updatedMessages.map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        sessionId: 'modal_chat'
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.response,
        timestamp: new Date(),
        success: response.success
      };

      setMessages(prev => [...prev, aiMessage]);

      if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to get response from AI assistant');
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
        success: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
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
    setError(null);
    setInterimTranscript('');

    let baseText = inputMessage ? inputMessage.trim() + ' ' : '';

    const startWebSpeechFallback = () => {
      setIsMicReady(true);
      const stopFn = lawBot360AI.startListeningStreaming('en-IN', {
        onTranscript: (finalText) => {
          baseText += finalText + ' ';
          setInputMessage(baseText.trim());
          setInterimTranscript('');
        },
        onInterim: (interim) => {
          setInterimTranscript(interim);
        },
        onError: (err) => {
          console.warn('[AIChat Voice] WebSpeech error:', err);
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
          language: 'multi',
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
            console.warn('[AIChat Voice] Deepgram error, falling back to Web Speech:', err);
            deepgramService.stopListening();
            startWebSpeechFallback();
          }
        });
        activeVoiceStopRef.current = () => deepgramService.stopListening();
      } catch (err) {
        console.warn('[AIChat Voice] Deepgram start failed, falling back to Web Speech:', err);
        startWebSpeechFallback();
      }
    } else {
      startWebSpeechFallback();
    }
  };

  const handleSpeak = (text) => {
    if (isSpeaking) {
      if (activeSpeakerRef.current) {
        try { activeSpeakerRef.current.stop(); } catch (e) {}
        activeSpeakerRef.current = null;
      }
      lawBot360AI.stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (activeSpeakerRef.current) {
        try { activeSpeakerRef.current.stop(); } catch (e) {}
        activeSpeakerRef.current = null;
      }
      lawBot360AI.stopSpeaking();
      setIsSpeaking(true);

      const controller = lawBot360AI.speak(text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          activeSpeakerRef.current = null;
        },
        onError: () => {
          setIsSpeaking(false);
          activeSpeakerRef.current = null;
        }
      });
      activeSpeakerRef.current = controller;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Consumer Rights', icon: Scale, prompt: 'I need help with consumer rights and complaints' },
    { label: 'RTI Application', icon: FileText, prompt: 'Help me file an RTI application' },
    { label: 'Property Law', icon: MessageSquare, prompt: 'I have a property law question' }
  ];

  const handleQuickAction = (prompt) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">LawBot360 AI</h2>
              <p className="text-sm text-gray-600">Your Legal Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[70%] ${message.type === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`p-4 rounded-2xl ${message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  {message.type === 'ai' ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  {message.type === 'ai' && (
                    <button
                      onClick={() => handleSpeak(message.content)}
                      className="mt-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 p-4 rounded-2xl">
                <LoadingStatus compact />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm transition-colors"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? 'Listening... speak now' : 'Ask me about your legal rights, document generation, or any law-related question...'}
                className="w-full p-4 pr-12 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                disabled={isLoading}
              />
              {isListening && interimTranscript && (
                <div className="absolute bottom-1 left-4 right-14 text-xs text-blue-500 italic truncate">
                  {interimTranscript}...
                </div>
              )}
              <button
                onClick={handleVoiceInput}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${isListening
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;