import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Loader } from 'lucide-react';
import lawBot360AI from '../services/aiService';
import LoadingStatus from './LoadingStatus';

const VoiceAgent = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationLog, setConversationLog] = useState([]);

  useEffect(() => {
    if (isOpen) {
      initializeVoiceAgent();
    } else {
      cleanup();
    }
    
    return cleanup;
  }, [isOpen]);

  const initializeVoiceAgent = async () => {
    try {
      setIsConnected(true);
      // Welcome message
      const welcomeMessage = "Hello! I'm your AI legal assistant. I can help you with Indian law queries, document generation, and legal guidance. How can I assist you today?";
      setResponse(welcomeMessage);
      lawBot360AI.speak(welcomeMessage);
      setIsSpeaking(true);
    } catch (error) {
      console.error('Failed to initialize voice agent:', error);
    }
  };

  const cleanup = () => {
    lawBot360AI.stopListening();
    lawBot360AI.stopSpeaking();
    setIsListening(false);
    setIsSpeaking(false);
    setIsConnected(false);
  };

  const startListening = async () => {
    if (isListening) {
      lawBot360AI.stopListening();
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      setTranscript('');
      
      const userInput = await lawBot360AI.startListening();
      setTranscript(userInput);
      setIsListening(false);
      
      // Process the user input
      await processUserInput(userInput);
    } catch (error) {
      console.error('Voice recognition error:', error);
      setIsListening(false);
      setTranscript('Voice recognition failed. Please try again.');
    }
  };

  const processUserInput = async (userInput) => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    
    // Add to conversation log
    const userMessage = {
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setConversationLog(prev => [...prev, userMessage]);

    try {
      // Get AI response
      const aiResponse = await lawBot360AI.sendMessage(userInput);
      
      const aiMessage = {
        type: 'ai',
        content: aiResponse.response,
        timestamp: new Date(),
        success: aiResponse.success
      };
      
      setConversationLog(prev => [...prev, aiMessage]);
      setResponse(aiResponse.response);
      
      // Speak the response
      if (aiResponse.success) {
        lawBot360AI.speak(aiResponse.response);
        setIsSpeaking(true);
      }
    } catch (error) {
      console.error('Error processing user input:', error);
      const errorResponse = "I apologize, but I encountered an error. Please try again.";
      setResponse(errorResponse);
      lawBot360AI.speak(errorResponse);
      setIsSpeaking(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      lawBot360AI.stopSpeaking();
      setIsSpeaking(false);
    } else if (response) {
      lawBot360AI.speak(response);
      setIsSpeaking(true);
    }
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
              <h2 className="text-xl font-bold text-gray-900">Voice Legal Assistant</h2>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Connecting...'}
              </p>
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
            {isProcessing ? (
              <LoadingStatus compact className="text-blue-600 justify-center" />
            ) : isListening ? (
              <div className="text-red-600">
                <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse mx-auto mb-2" />
                <span>Listening... Speak now</span>
              </div>
            ) : isSpeaking ? (
              <div className="text-green-600">
                <div className="flex gap-1 justify-center mb-2">
                  <div className="w-2 h-4 bg-green-600 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-4 bg-green-600 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-4 bg-green-600 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Speaking...</span>
              </div>
            ) : (
              <div className="text-gray-600">
                <span>Ready to help with your legal questions</span>
              </div>
            )}
          </div>

          {/* Main Voice Button */}
          <button
            onClick={startListening}
            disabled={isProcessing}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg'
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>

          <p className="text-sm text-gray-500 mt-4 text-center">
            {isListening ? 'Click to stop listening' : 'Click to start speaking'}
          </p>

          {/* Transcript Display */}
          {transcript && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
              <p className="text-sm text-gray-800">
                <strong>You said:</strong> "{transcript}"
              </p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
              <div className="flex items-start justify-between">
                <p className="text-sm text-gray-800 flex-1">
                  <strong>Assistant:</strong> {response.substring(0, 150)}
                  {response.length > 150 ? '...' : ''}
                </p>
                <button
                  onClick={toggleSpeaking}
                  className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors"
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                >
                  {isSpeaking ? (
                    <VolumeX className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-gray-200 flex justify-center gap-4">
          <button
            onClick={toggleSpeaking}
            disabled={!response}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isSpeaking ? 'Stop' : 'Repeat'}
          </button>
          
          <button
            onClick={() => {
              setConversationLog([]);
              setTranscript('');
              setResponse('');
              lawBot360AI.clearHistory();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
          >
            Clear Chat
          </button>
        </div>

        {/* Conversation Log */}
        {conversationLog.length > 0 && (
          <div className="max-h-32 overflow-y-auto p-4 border-t border-gray-100 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Conversation History</h4>
            <div className="space-y-1">
              {conversationLog.slice(-3).map((msg, index) => (
                <div key={index} className="text-xs">
                  <span className={`font-medium ${msg.type === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                    {msg.type === 'user' ? 'You' : 'Assistant'}:
                  </span>
                  <span className="text-gray-600 ml-1">
                    {msg.content.substring(0, 50)}...
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

export default VoiceAgent;