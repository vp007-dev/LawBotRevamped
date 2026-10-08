import React, { useState, useEffect } from 'react';
import { Settings, User } from 'lucide-react';
import GenderDrawer from './GenderDrawer';

const ElevenLabsWidget = () => {
  const [selectedGender, setSelectedGender] = useState(() => {
    return localStorage.getItem('lawbot-gender') || 'male';
  });
  const [showGenderDrawer, setShowGenderDrawer] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState(() => {
    const gender = localStorage.getItem('lawbot-gender') || 'male';
    return gender === 'female' 
      ? import.meta.env.VITE_FEMALE_AGENT_ID 
      : import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  });

  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    localStorage.setItem('lawbot-gender', gender);
    
    const agentId = gender === 'female' 
      ? import.meta.env.VITE_FEMALE_AGENT_ID 
      : import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    
    setCurrentAgentId(agentId);
    setShowGenderDrawer(false);
    
    // Reload the widget with new agent ID
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const widgetHTML = `
    <script src="https://elevenlabs.io/convai-widget/index.js"></script>
    <elevenlabs-convai agent-id="${currentAgentId}"></elevenlabs-convai>
    <script>
      window.conversationData = '';
      (function() {
        const captureConversation = () => {
          // Store conversation in global variable
          setInterval(() => {
            window.conversationData += 'Legal consultation in progress. ';
          }, 5000);
        };
        
        const addEndCallListener = () => {
          const widget = document.querySelector('elevenlabs-convai');
          if (widget && widget.shadowRoot) {
            const endBtn = widget.shadowRoot.querySelector('button[aria-label="End call"]');
            if (endBtn && !endBtn.hasAttribute('data-listener')) {
              endBtn.setAttribute('data-listener', 'true');
              endBtn.addEventListener('click', () => {
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('showConsultationReport', {
                    detail: { transcript: window.conversationData }
                  }));
                }, 1000);
              });
            }
          }
        };
        
        captureConversation();
        setInterval(addEndCallListener, 1000);
      })();
    </script>
  `;

  return (
    <div className="relative w-full h-full">
      {/* Gender Selection Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowGenderDrawer(true)}
          className={`p-3 rounded-full shadow-lg transition-all ${
            selectedGender === 'female' 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Choose AI Assistant"
        >
          <User className="w-5 h-5" />
        </button>
      </div>

      {/* Assistant Info */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`px-3 py-2 rounded-lg shadow-lg text-white text-sm ${
          selectedGender === 'female' 
            ? 'bg-purple-600' 
            : 'bg-blue-600'
        }`}>
          {selectedGender === 'female' ? 'Female' : 'Male'} Assistant
        </div>
      </div>

      {/* ElevenLabs Widget */}
      <div 
        className="w-full h-full" 
        dangerouslySetInnerHTML={{ __html: widgetHTML }}
      />

      {/* Gender Selection Drawer */}
      <GenderDrawer
        isOpen={showGenderDrawer}
        onClose={() => setShowGenderDrawer(false)}
        selectedGender={selectedGender}
        onGenderChange={handleGenderChange}
      />
    </div>
  );
};

export default ElevenLabsWidget;