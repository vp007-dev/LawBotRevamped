/**
 * Deepgram STT + TTS Service for LawBot360
 * 
 * STT: Real-time streaming via WebSocket (nova-3 model)
 * TTS: REST API via Deepgram Aura (aura-2-thalia-en)
 */

class DeepgramService {
    constructor() {
        this.apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY || '';
        this.ws = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.isListening = false;
        this.currentAudio = null;
        this.isSpeaking = false;

        // Callbacks
        this.onTranscript = null;       // Called with interim transcripts
        this.onFinalTranscript = null;  // Called with final transcripts
        this.onError = null;
        this.onListeningChange = null;
    }

    /** Check if Deepgram API key is configured */
    isAvailable() {
        return !!this.apiKey;
    }

    // ─── STT: Speech-to-Text via WebSocket ──────────────────────────────

    /**
     * Start real-time speech-to-text streaming.
     * 
     * @param {Object} options
     * @param {string} options.language - Language code (e.g., 'en', 'hi', 'multi')
     * @param {Function} options.onTranscript - Called with { transcript, isFinal } on each result
     * @param {Function} options.onReady - Called when connection is established
     * @param {Function} options.onError - Called with error message
     * @returns {Promise<void>}
     */
    async startListening({ language = 'multi', onTranscript, onReady, onError } = {}) {
        if (this.isListening) return;
        if (!this.apiKey) {
            onError?.('Deepgram API key not configured');
            throw new Error('Deepgram API key not configured');
        }

        this.onTranscript = onTranscript;
        this.onError = onError;

        try {
            // Get microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            // Open WebSocket to Deepgram
            // NOTE: Do NOT specify encoding/sample_rate — Deepgram auto-detects
            // the webm container format that MediaRecorder produces
            const wsUrl = new URL('wss://api.deepgram.com/v1/listen');
            wsUrl.searchParams.set('model', 'nova-3');
            wsUrl.searchParams.set('language', language);
            wsUrl.searchParams.set('smart_format', 'true');
            wsUrl.searchParams.set('interim_results', 'true');
            wsUrl.searchParams.set('utterance_end_ms', '1500');
            wsUrl.searchParams.set('vad_events', 'true');
            
            // Optimization for code-switching (Hinglish) and domain specificity
            wsUrl.searchParams.set('endpointing', '100');
            
            // Legal keyterms to bias the model for Indian legal context (Nova-3 uses keyterm NOT keywords)
            const legalTerms = [
                'RTI', 'FIR', 'IPC', 'CrPC', 'Contract', 'Agreement', 'Affidavit', 'Adalat', 
                'Vakil', 'Nyay', 'Court', 'Police', 'Thana', 'Kacheri', 'Kanoon', 'Gawah', 
                'Saboot', 'Bail', 'Arrest', 'Warrant', 'Petition', 'Advocate', 'High Court', 
                'Supreme Court', 'District Court', 'LawBot', 'LawBot360'
            ];
            wsUrl.searchParams.set('keyterm', legalTerms.join(','));

            this.ws = new WebSocket(wsUrl.toString(), ['token', this.apiKey]);

            await new Promise((resolve, reject) => {
                this.ws.onopen = () => {
                    console.log('[Deepgram STT] WebSocket connected');
                    resolve();
                };
                this.ws.onerror = (err) => {
                    console.error('[Deepgram STT] WebSocket error:', err);
                    reject(new Error('Failed to connect to Deepgram'));
                };
                // Timeout after 10s
                setTimeout(() => reject(new Error('Deepgram connection timeout')), 10000);
            });

            // Handle incoming transcription results
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[Deepgram STT] Message:', data.type, data.is_final ? '(final)' : '(interim)');

                    if (data.type === 'Results' && data.channel?.alternatives?.length > 0) {
                        const alt = data.channel.alternatives[0];
                        const transcript = alt.transcript;

                        if (transcript) {
                            this.onTranscript?.({
                                transcript,
                                isFinal: data.is_final,
                                confidence: alt.confidence,
                            });
                        }
                    }
                } catch (err) {
                    console.error('[Deepgram STT] Parse error:', err);
                }
            };

            this.ws.onclose = (event) => {
                console.log('[Deepgram STT] WebSocket closed:', event.code, event.reason);
                this._cleanupSTT();
            };

            this.ws.onerror = (err) => {
                console.error('[Deepgram STT] WebSocket error:', err);
                this.onError?.('Deepgram connection error');
                this._cleanupSTT();
            };

            // Start MediaRecorder to stream audio
            // Use webm/opus — Deepgram auto-detects this container format
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';

            const recorderOptions = mimeType ? { mimeType } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);
            console.log('[Deepgram STT] MediaRecorder mimeType:', this.mediaRecorder.mimeType);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(event.data);
                }
            };

            this.mediaRecorder.start(250); // Send audio every 250ms
            this.isListening = true;
            this.onListeningChange?.(true);
            onReady?.();
            console.log('[Deepgram STT] Listening started');

        } catch (err) {
            console.error('[Deepgram STT] Start error:', err);
            this._cleanupSTT();
            throw err;
        }
    }

    /** Stop listening and close the connection */
    stopListening() {
        if (!this.isListening) return;

        // Send close message to Deepgram to flush final results
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'CloseStream' }));
            // Give Deepgram 500ms to send final results before closing
            setTimeout(() => {
                this._cleanupSTT();
            }, 500);
        } else {
            this._cleanupSTT();
        }
    }

    /** Internal cleanup for STT resources */
    _cleanupSTT() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try { this.mediaRecorder.stop(); } catch (e) { /* ignore */ }
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
                this.ws.close();
            }
            this.ws = null;
        }
        this.mediaRecorder = null;
        this.isListening = false;
        this.onListeningChange?.(false);
    }

    /**
     * Listen for speech and return the final transcript as a string.
     * Stops automatically after 1.5s of silence (utterance_end_ms).
     * 
     * @param {string} language - Language code
     * @returns {Promise<string>} The transcribed text
     */
    startListeningSimple(language = 'multi') {
        return new Promise((resolve, reject) => {
            let fullTranscript = '';
            let silenceTimeout = null;

            this.startListening({
                language,
                onTranscript: ({ transcript, isFinal }) => {
                    if (isFinal) {
                        fullTranscript += transcript + ' ';
                        // Reset silence timer — stop after 2s of no new final results
                        clearTimeout(silenceTimeout);
                        silenceTimeout = setTimeout(() => {
                            this.stopListening();
                            resolve(fullTranscript.trim());
                        }, 2000);
                    }
                },
                onError: (err) => {
                    this.stopListening();
                    reject(new Error(err));
                }
            }).catch(reject);
        });
    }

    // ─── TTS: Text-to-Speech via REST API ───────────────────────────────

    /**
     * Strip markdown formatting from text so TTS doesn't read symbols.
     */
    _stripMarkdown(text) {
        return text
            // Remove bold/italic markers
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            // Remove headers
            .replace(/^#{1,6}\s+/gm, '')
            // Remove bullet points and list markers
            .replace(/^[\s]*[-*•✓✗]\s+/gm, '')
            .replace(/^[\s]*\d+\.\s+/gm, '')
            // Remove horizontal rules
            .replace(/^---+$/gm, '')
            // Remove links [text](url) → text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove inline code
            .replace(/`([^`]+)`/g, '$1')
            // Remove emojis and special symbols
            .replace(/[📄⚖️💼🏠💰👨‍👩‍👧❌✓✗☐☑️🔴⚠️]/g, '')
            // Collapse multiple newlines/spaces
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, '. ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    /**
     * Convert text to speech using Deepgram Aura and play it.
     * 
     * @param {string} text - Text to speak
     * @param {string} model - Deepgram TTS model
     * @returns {Promise<{ audio: HTMLAudioElement, onEnd: Promise<void> }>}
     */
    async speak(text, model = 'aura-2-andromeda-en') {
        if (!text?.trim()) return null;
        if (!this.apiKey) {
            console.warn('[Deepgram TTS] API key not configured');
            return null;
        }

        // Stop any currently playing audio
        this.stopSpeaking();

        // Clean markdown and limit length to avoid huge delays
        let cleanText = this._stripMarkdown(text);
        if (cleanText.length > 1000) {
            cleanText = cleanText.substring(0, 1000) + '... That is the summary.';
        }

        try {
            const response = await fetch(
                `https://api.deepgram.com/v1/speak?model=${model}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: cleanText }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Deepgram TTS error ${response.status}: ${errorText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            this.currentAudio = audio;
            this.isSpeaking = true;

            const onEnd = new Promise((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    this.isSpeaking = false;
                    this.currentAudio = null;
                    resolve();
                };
                audio.onerror = (err) => {
                    console.error('[Deepgram TTS] Playback error:', err);
                    URL.revokeObjectURL(audioUrl);
                    this.isSpeaking = false;
                    this.currentAudio = null;
                    resolve();
                };
            });

            await audio.play();
            return { audio, onEnd };

        } catch (err) {
            console.error('[Deepgram TTS] Error:', err);
            this.isSpeaking = false;
            this.currentAudio = null;
            throw err;
        }
    }

    /** Stop any currently playing TTS audio */
    stopSpeaking() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isSpeaking = false;
    }

    /** Clean up all resources */
    destroy() {
        this.stopListening();
        this.stopSpeaking();
    }
}

// Export singleton
const deepgramService = new DeepgramService();
export default deepgramService;
