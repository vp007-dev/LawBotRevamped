// src/services/awsAiService.js
// Unified AWS AI Service powering LawBot360 under the hood

export const AWS_MODELS = [
  {
    id: 'amazon.nova-pro-v1:0',
    shortName: 'Amazon Nova Pro',
    provider: 'Amazon Bedrock Native',
    description: 'Flagship multimodal reasoning with deep statutory & constitutional knowledge',
    badge: 'Flagship Legal'
  },
  {
    id: 'us.meta.llama3-3-70b-instruct-v1:0',
    shortName: 'Llama 3.3 70B',
    provider: 'Meta on AWS Bedrock',
    description: 'High-performance open weights legal advice & procedural guidance',
    badge: 'Legal Reasoning'
  },
  {
    id: 'amazon.nova-lite-v1:0',
    shortName: 'Amazon Nova Lite',
    provider: 'Amazon Bedrock Native',
    description: 'Fast, balanced statutory queries & document summary',
    badge: 'High Speed'
  },
  {
    id: 'amazon.nova-micro-v1:0',
    shortName: 'Amazon Nova Micro',
    provider: 'Amazon Bedrock Native',
    description: 'Ultra-fast sub-second latency for legal definitions and quick FAQs',
    badge: 'Ultra Fast'
  }
];

class AwsAiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_AWS_API_KEY || '';
    this.accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';
    this.region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
    this.customEndpoint = import.meta.env.VITE_AWS_ENDPOINT || '';

    // Active model selection stored in localStorage with validation
    const savedModel = typeof window !== 'undefined' ? localStorage.getItem('lawbot-aws-model') : null;
    const isSavedValid = AWS_MODELS.some(m => m.id === savedModel);

    const envModel = import.meta.env.VITE_AWS_MODEL;
    const isEnvValid = AWS_MODELS.some(m => m.id === envModel);

    this.currentModelId = isSavedValid
      ? savedModel
      : (isEnvValid ? envModel : AWS_MODELS[0].id);

    // Save validated model
    if (typeof window !== 'undefined' && !isSavedValid) {
      localStorage.setItem('lawbot-aws-model', this.currentModelId);
    }

    this.bedrockProxyUrl = '/api/bedrock';
    this.backendUrl = '/api/v1/aws/chat';
  }

  /**
   * Get available AWS models
   */
  getAvailableModels() {
    return AWS_MODELS;
  }

  /**
   * Get currently active AWS model object
   */
  getActiveModel() {
    return AWS_MODELS.find(m => m.id === this.currentModelId) || AWS_MODELS[0];
  }

  /**
   * Switch active AWS model
   */
  setModel(modelId) {
    const found = AWS_MODELS.find(m => m.id === modelId);
    if (found) {
      this.currentModelId = found.id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('lawbot-aws-model', found.id);
      }
      console.log(`[AWS AI Engine] Active model set to: ${found.shortName} (${found.id})`);
    }
  }

  /**
   * Check AWS configuration status
   */
  getConfigStatus() {
    const hasKey = !!(this.apiKey || this.accessKeyId);
    const activeModel = this.getActiveModel();
    return {
      hasKey,
      currentModel: activeModel.shortName,
      modelId: this.currentModelId,
      region: this.region,
      provider: 'AWS Bedrock Engine'
    };
  }

  /**
   * Format generic conversation messages and system prompt into AWS Bedrock Converse API payload
   */
  formatBedrockConversePayload(messages, systemPrompt = '', options = {}) {
    let combinedSystem = systemPrompt || '';
    const cleanList = [];

    for (const msg of (messages || [])) {
      const rawRole = (msg.role || 'user').toLowerCase();
      let textContent = '';

      if (typeof msg.content === 'string') {
        textContent = msg.content.trim();
      } else if (Array.isArray(msg.content)) {
        textContent = msg.content.map(c => (typeof c === 'string' ? c : c?.text || '')).join('\n').trim();
      } else if (msg.content) {
        textContent = String(msg.content).trim();
      }

      if (!textContent) continue;

      if (rawRole === 'system') {
        combinedSystem = combinedSystem ? `${combinedSystem}\n\n${textContent}` : textContent;
      } else {
        const role = rawRole === 'assistant' ? 'assistant' : 'user';
        cleanList.push({ role, text: textContent });
      }
    }

    // Merge consecutive same-role messages to guarantee strict alternation (user -> assistant -> user)
    const alternating = [];
    for (const item of cleanList) {
      if (alternating.length > 0 && alternating[alternating.length - 1].role === item.role) {
        alternating[alternating.length - 1].content[0].text += `\n\n${item.text}`;
      } else {
        alternating.push({
          role: item.role,
          content: [{ text: item.text }]
        });
      }
    }

    // Bedrock Converse API requires the first message to be from 'user'
    if (alternating.length > 0 && alternating[0].role !== 'user') {
      alternating.unshift({
        role: 'user',
        content: [{ text: 'Please proceed with legal consultation.' }]
      });
    }

    // If completely empty, insert initial user prompt
    if (alternating.length === 0) {
      alternating.push({
        role: 'user',
        content: [{ text: 'Hello' }]
      });
    }

    const payload = {
      messages: alternating,
      inferenceConfig: {
        maxTokens: options.max_tokens || 4096,
        temperature: options.temperature !== undefined ? options.temperature : 0.3
      }
    };

    if (combinedSystem) {
      payload.system = [{ text: combinedSystem }];
    }

    return payload;
  }

  /**
   * Invoke AWS AI Engine with conversational messages and system prompt
   */
  async invokeChat(messages, systemPrompt = '', options = {}) {
    const modelId = options.model || this.currentModelId;
    const bedrockPayload = this.formatBedrockConversePayload(messages, systemPrompt, options);

    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Route 1: Local Vite proxy (/api/bedrock/model/:id/converse) - fastest, no CORS issues in dev
    const viteProxyEndpoint = `${this.bedrockProxyUrl}/model/${encodeURIComponent(modelId)}/converse`;
    try {
      const resp = await fetch(viteProxyEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bedrockPayload)
      });

      if (resp.ok) {
        const data = await resp.json();
        const text = data?.output?.message?.content?.[0]?.text;
        if (text) return text;
      } else {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = errData.message || errData.detail;
        if (resp.status !== 404 && resp.status !== 502 && errMsg) {
          throw new Error(`AWS Bedrock: ${errMsg}`);
        }
      }
    } catch (err) {
      if (err.message && err.message.startsWith('AWS Bedrock:')) {
        throw err;
      }
      console.warn('Vite Bedrock proxy unavailable, trying direct Bedrock endpoint:', err.message);
    }

    // Route 2: Direct AWS Bedrock Runtime endpoint (CORS supported natively by Bedrock Converse API)
    if (this.apiKey) {
      const directEndpoint = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;
      try {
        const resp = await fetch(directEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(bedrockPayload)
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.output?.message?.content?.[0]?.text;
          if (text) return text;
        } else {
          const errData = await resp.json().catch(() => ({}));
          const errMsg = errData.message || errData.detail;
          if (errMsg) {
            throw new Error(`AWS Bedrock: ${errMsg}`);
          }
        }
      } catch (err) {
        if (err.message && err.message.startsWith('AWS Bedrock:')) {
          throw err;
        }
        console.warn('Direct AWS Bedrock endpoint failed:', err.message);
      }
    }

    // Route 3: Custom endpoint if configured in .env (API Gateway or custom proxy)
    if (this.customEndpoint) {
      try {
        const customHeaders = { 'Content-Type': 'application/json' };
        if (this.apiKey) {
          customHeaders['x-api-key'] = this.apiKey;
          customHeaders['Authorization'] = `Bearer ${this.apiKey}`;
        }
        const resp = await fetch(this.customEndpoint, {
          method: 'POST',
          headers: customHeaders,
          body: JSON.stringify(bedrockPayload)
        });
        if (resp.ok) {
          const data = await resp.json();
          const content = data.content || data.response || data?.output?.message?.content?.[0]?.text;
          if (content) return content;
        }
      } catch (err) {
        console.warn('Custom AWS endpoint failed:', err.message);
      }
    }

    // Route 4: Fallback to FastAPI backend AWS router (/api/v1/aws/chat) if backend is running
    try {
      const backendPayload = {
        model: modelId,
        system: systemPrompt,
        messages: messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.3,
        max_tokens: options.max_tokens || 4096
      };
      const resp = await fetch(this.backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload)
      });

      if (resp.ok) {
        const data = await resp.json();
        return data.content || data.response;
      }
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.detail || `AWS Backend error: ${resp.status}`);
    } catch (err) {
      console.warn('All AWS Bedrock invocation routes failed:', err.message);
      throw err;
    }
  }
}

export const awsAiService = new AwsAiService();
export default awsAiService;
