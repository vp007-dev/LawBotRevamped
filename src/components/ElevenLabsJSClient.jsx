import React, { useState, useRef, useEffect } from 'react';
import { Mic, Phone, Activity, Send, MicOff } from 'lucide-react';

const ElevenLabsJSClient = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const conversationRef = useRef(null);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);

  // Remove SDK loading since we're using direct API
  useEffect(() => {
    console.log('ElevenLabs component initialized');
  }, []);

  const startConversation = async () => {
    try {
      // Get signed URL for WebSocket connection
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${import.meta.env.VITE_ELEVENLABS_AGENT_ID}`, {
        method: 'GET',
        headers: {
          'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const signedUrl = data.signed_url;
      setConversationId(signedUrl);
      
      // Establish WebSocket connection
      wsRef.current = new WebSocket(signedUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setMessages([{
          id: Date.now(),
          type: 'agent',
          text: 'Connected! I can hear you now.',
          timestamp: new Date()
        }]);
        // Start audio capture immediately
        startAudioCapture();
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'audio' && data.audio_event) {
          // Handle ElevenLabs audio format
          const audioData = data.audio_event.audio_base_64;
          if (audioData) {
            try {
              const binaryString = atob(audioData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              audio.play().then(() => {
                console.log('Audio playing');
              }).catch(e => {
                console.error('Audio play error:', e);
                // Try with different audio type
                const audioBlob2 = new Blob([bytes], { type: 'audio/wav' });
                const audioUrl2 = URL.createObjectURL(audioBlob2);
                const audio2 = new Audio(audioUrl2);
                audio2.play().catch(e2 => console.error('Audio play error 2:', e2));
              });
            } catch (e) {
              console.error('Audio decode error:', e);
            }
          }
        }
        
        if (data.type === 'agent_response' && data.agent_response_event) {
          const message = data.agent_response_event.agent_response;
          if (message) {
            setMessages(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'agent',
              text: message,
              timestamp: new Date()
            }]);
          }
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        stopAudioCapture();
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Convert to base64 and send as JSON - ElevenLabs expects JSON only
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = reader.result.split(',')[1];
            wsRef.current.send(JSON.stringify({
              user_audio_chunk: {
                chunk: base64Audio
              }
            }));
          };
          reader.readAsDataURL(event.data);
        }
      };
      
      mediaRecorderRef.current.start(250);
      setIsListening(true);
      console.log('Audio capture started');
      
    } catch (error) {
      console.error('Error starting audio capture:', error);
    }
  };

  const stopAudioCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      const tracks = mediaRecorderRef.current.stream?.getTracks();
      tracks?.forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
    console.log('Audio capture stopped');
  };

  const endConversation = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioCapture();
    setConversationId(null);
    setIsConnected(false);
    setMessages([]);
    setInputText('');
  };

  const sendMessage = (text) => {
    if (!text.trim() || !wsRef.current) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: text,
      timestamp: new Date()
    }]);
    
    // Send text message via WebSocket in ElevenLabs format
    wsRef.current.send(JSON.stringify({
      user_message: {
        message: text
      }
    }));
    
    setInputText('');
  };

  const toggleMute = () => {
    if (mediaRecorderRef.current) {
      if (isMuted) {
        mediaRecorderRef.current.resume();
      } else {
        mediaRecorderRef.current.pause();
      }
    }
    setIsMuted(!isMuted);
    console.log('Microphone', isMuted ? 'unmuted' : 'muted');
  };

  const sendFeedback = (positive) => {
    console.log('Feedback sent:', positive ? 'positive' : 'negative');
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
      isConnected 
        ? 'bg-slate-900 border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
        : 'bg-white border border-slate-200 shadow-xl hover:shadow-2xl'
    }`}>
      {/* Background Decor for Active State */}
      {isConnected && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      )}

      <div className="p-8 relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isConnected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {isConnected ? (
                isListening ? <Activity className="w-7 h-7 animate-pulse" /> : <Mic className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isConnected ? 'text-white' : 'text-slate-900'}`}>
                ElevenLabs API Agent
              </h3>
              <p className={`text-sm ${isConnected ? 'text-blue-200' : 'text-slate-500'}`}>
                {isConnected ? 'Agent Connected' : 'Direct API Integration'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Interaction Area */}
        <div className="space-y-4">
          <button
            onClick={isConnected ? endConversation : startConversation}
            className={`group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform active:scale-95 ${
              isConnected
                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white'
                : 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg hover:shadow-blue-500/25 hover:translate-y-[-2px]'
            }`}
          >
            {isConnected ? (
              <>
                <Phone className="w-5 h-5 rotate-135" />
                End Conversation
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 group-hover:animate-bounce" />
                Start AI Agent
              </>
            )}
          </button>

          <div className={`text-center text-xs font-medium transition-colors ${
            isConnected ? 'text-blue-300' : 'text-slate-400'
          }`}>
            {isConnected 
              ? `Agent active • ID: ${conversationId?.slice(0, 8)}...` 
              : 'Click to start a conversation with your AI agent.'}
          </div>
        </div>
      </div>

      {/* Custom Chat Interface */}
      <div className={`transition-[max-height, opacity] duration-700 ease-in-out overflow-hidden ${
        isConnected ? 'max-h-[600px] opacity-100 border-t border-slate-700' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-slate-900 p-4">
          {/* Messages */}
          <div className="h-80 overflow-y-auto mb-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-100'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputText)}
              placeholder="Type your legal question..."
              className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={toggleMute}
              disabled={!isConnected}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !isConnected ? 'bg-slate-600 text-slate-400 cursor-not-allowed' :
                isMuted 
                  ? 'bg-red-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => sendMessage(inputText)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          {/* Feedback Buttons */}
          {isConnected && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => sendFeedback(true)}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                👍 Good
              </button>
              <button
                onClick={() => sendFeedback(false)}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                👎 Bad
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default ElevenLabsJSClient;