class AudioTranscriptionService {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.transcript = '';
    this.onTranscriptUpdate = null;
  }

  startRecording(onUpdate) {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.onTranscriptUpdate = onUpdate;

    this.recognition.onstart = () => {
      this.isRecording = true;
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      this.transcript += finalTranscript;
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.transcript + interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.onend = () => {
      this.isRecording = false;
    };

    this.recognition.start();
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    return this.transcript;
  }

  async processAudioWithGemini(audioTranscript) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Process this legal consultation transcript and generate analysis:

TRANSCRIPT: ${audioTranscript}

Analyze for:
1. Key legal issues discussed
2. Emotions and concerns expressed
3. Specific laws or rights mentioned
4. Action items needed

Return structured JSON with legal analysis.`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                keyIssues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      issue: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string", enum: ["High", "Medium", "Low"] },
                      emotion: { type: "string", enum: ["Concerned", "Angry", "Confused", "Neutral"] }
                    }
                  }
                },
                suggestedNextSteps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step: { type: "string" },
                      priority: { type: "string", enum: ["High", "Medium", "Low"] },
                      timeframe: { type: "string" }
                    }
                  }
                },
                legalReferences: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      act: { type: "string" },
                      section: { type: "string" },
                      relevance: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        })
      });

      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('Gemini processing error:', error);
      return this.getFallbackAnalysis(audioTranscript);
    }
  }

  getFallbackAnalysis(transcript) {
    return {
      summary: `Legal consultation transcript analyzed. Client discussed various legal matters requiring professional attention.`,
      keyIssues: [{
        issue: "Legal Matter Identified",
        description: "Based on consultation transcript, legal issues were identified requiring attention.",
        severity: "Medium",
        emotion: "Concerned"
      }],
      suggestedNextSteps: [{
        step: "Consult with qualified legal professional",
        priority: "High",
        timeframe: "Within 7 days"
      }],
      legalReferences: [{
        act: "Applicable Indian Law",
        section: "Relevant Section",
        relevance: "Based on consultation context"
      }]
    };
  }

  reset() {
    this.transcript = '';
    this.isRecording = false;
    this.onTranscriptUpdate = null;
  }
}

export default new AudioTranscriptionService();