import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const DeepgramVoiceAgent = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [conversationLog, setConversationLog] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const deepgramConnectionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initializeDeepgramAgent();
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [isOpen]);

  const initializeDeepgramAgent = async () => {
    try {
      setConnectionStatus('Connecting...');
      
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Setup MediaRecorder for audio streaming
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Simulate Deepgram connection (replace with actual Deepgram SDK)
      await connectToDeepgram();
      
      setIsConnected(true);
      setConnectionStatus('Connected - Ready to assist');
      
      // Start with greeting
      addToConversationLog('assistant', 'Namaste! I am Advocate LawBot360, your legal counsel. How may I assist you with your legal matter today?');
      
    } catch (error) {
      console.error('Failed to initialize Deepgram Voice Agent:', error);
      setConnectionStatus('Connection failed');
    }
  };

  const connectToDeepgram = async () => {
    // Simulate Deepgram Voice Agent connection
    // In production, use actual Deepgram SDK
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Deepgram Voice Agent connected');
        resolve();
      }, 1000);
    });
  };

  const startListening = async () => {
    if (!isConnected || isListening) return;
    
    try {
      setIsListening(true);
      
      // Start recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.start(100); // Send data every 100ms
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            // Send audio data to Deepgram
            sendAudioToDeepgram(event.data);
          }
        };
      }
      
    } catch (error) {
      console.error('Error starting voice input:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const sendAudioToDeepgram = (audioData) => {
    // Simulate sending audio to Deepgram Voice Agent
    // In production, send to actual Deepgram WebSocket
    console.log('Sending audio data to Deepgram:', audioData.size, 'bytes');
    
    // Simulate response after processing
    setTimeout(() => {
      simulateVoiceResponse();
    }, 2000);
  };

  const simulateVoiceResponse = () => {
    const responses = [
      "I understand your concern. Let me analyze this legal matter for you.",
      "Based on Indian law, you have several options available. Let me explain them.",
      "This falls under consumer protection law. I can help you file a complaint.",
      "For this property dispute, we need to examine the relevant documents first.",
      "I recommend we proceed with an RTI application in this case."
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    addToConversationLog('assistant', response);
    
    // Simulate text-to-speech
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  const addToConversationLog = (type, message) => {
    setConversationLog(prev => [...prev, {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    }]);
  };

  const cleanup = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setConnectionStatus('Disconnected');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Advocate LawBot360</h2>
              <p className="text-sm text-gray-600">{connectionStatus}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        {/* Voice Interface */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Status Display */}
          <div className="text-center mb-8">
            {isSpeaking ? (
              <div className="text-blue-600">
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-2 h-8 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-6 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-10 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                  <div className="w-2 h-4 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '450ms' }} />
                </div>
                <span>Advocate speaking...</span>
              </div>
            ) : isListening ? (
              <div className="text-red-600">
                <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse mx-auto mb-2" />
                <span>Listening to your legal query...</span>
              </div>
            ) : (
              <div className="text-gray-600">
                <span>Ready for legal consultation</span>
              </div>
            )}
          </div>

          {/* Main Voice Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!isConnected}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50'
                : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-lg shadow-blue-500/50'
            } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>

          <p className="text-sm text-gray-500 mt-4 text-center">
            {isListening ? 'Click to stop listening' : 'Click to start speaking with your lawyer'}
          </p>

          {/* Professional Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md text-center">
            <p className="text-sm text-blue-800">
              <strong>Professional Legal Consultation</strong><br/>
              This is a real-time voice session with AI Advocate LawBot360
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 flex justify-center gap-4">
          <button
            onClick={() => setConversationLog([])}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Clear Session
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            End Consultation
          </button>
        </div>

        {/* Conversation Summary */}
        {conversationLog.length > 0 && (
          <div className="max-h-32 overflow-y-auto p-4 border-t border-gray-100 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Session Summary</h4>
            <div className="space-y-1">
              {conversationLog.slice(-3).map((msg) => (
                <div key={msg.id} className="text-xs">
                  <span className={`font-medium ${msg.type === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                    {msg.type === 'user' ? 'Client' : 'Advocate'}:
                  </span>
                  <span className="text-gray-600 ml-1">
                    {msg.message.substring(0, 60)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepgramVoiceAgent;