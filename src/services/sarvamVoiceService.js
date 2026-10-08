/**
 * Sarvam AI (Samvaad) Voice Telephony Service for LawBot 360
 * Connects with Sarvam's conversational voice platform (+91 7965480318)
 * Provides:
 * - Direct click-to-call redirection
 * - Instant Outbound callback trigger
 * - Call attempts & duration history
 * - Turn-by-turn dialogue transcripts (Hindi/English)
 */

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY || 'sk_samvaad_kapzzkw0_F5LrmEtNfdCtYaC6qGKa25lT';
const SARVAM_ORG_ID = import.meta.env.VITE_SARVAM_ORG_ID || '019f7b9b-ee04-74fe-baad-a7c49b277dc6';
const SARVAM_WORKSPACE_ID = import.meta.env.VITE_SARVAM_WORKSPACE_ID || '019f7b9b-ee07-72d5-98dd-0c526491a991';
const SARVAM_AGENT_ID = import.meta.env.VITE_SARVAM_AGENT_ID || 'Conversatio-8448e378-ecec';
const SARVAM_CONNECTION_ID = import.meta.env.VITE_SARVAM_CONNECTION_ID || '7cadae80-64-bdfd0995-1607';
const SARVAM_PHONE_NUMBER = import.meta.env.VITE_SARVAM_PHONE_NUMBER || '+91 7965480318';

export const sarvamVoiceService = {
  // Static configuration details
  getAgentDetails() {
    return {
      phoneNumber: SARVAM_PHONE_NUMBER,
      cleanPhone: SARVAM_PHONE_NUMBER.replace(/\s+/g, ''),
      telHref: `tel:${SARVAM_PHONE_NUMBER.replace(/\s+/g, '')}`,
      agentId: SARVAM_AGENT_ID,
      orgId: SARVAM_ORG_ID,
      workspaceId: SARVAM_WORKSPACE_ID,
      connectionId: SARVAM_CONNECTION_ID,
      name: 'LawBot 360 AI Helpline',
      language: 'Hindi & English (Vernacular Auto-Detect)',
      description: '24/7 Toll-Free Conversational Legal Intelligence Agent'
    };
  },

  /**
   * Fetches call attempts / history from Sarvam Analytics API
   * Uses Vite proxy (/api/sarvam) first to avoid CORS and backend downtime.
   */
  async getCallHistory({ limit = 50, offset = 0, start_datetime = '2024-01-01T00:00:00Z', end_datetime = '2026-12-31T23:59:59Z' } = {}) {
    const params = new URLSearchParams({
      start_datetime,
      end_datetime,
      limit: String(limit),
      offset: String(offset)
    });

    // Primary: Vite Reverse Proxy to Sarvam (/api/sarvam -> https://apps.sarvam.ai)
    try {
      const proxyUrl = `/api/sarvam/api/analytics/v1/${SARVAM_ORG_ID}/${SARVAM_WORKSPACE_ID}/${SARVAM_AGENT_ID}/attempts?${params.toString()}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'X-API-Key': SARVAM_API_KEY
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Vite proxy to Sarvam attempts failed, trying backend fallback...', err);
    }

    // Secondary Fallback: FastAPI Backend (if running on port 8000)
    try {
      const response = await fetch(`/api/v1/sarvam/attempts?${params.toString()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend not running
    }

    return { items: [], total: 0 };
  },

  /**
   * Fetches transcript turns for a single call interaction
   */
  async getTranscript(interactionId) {
    if (!interactionId || interactionId === 'NO_INTERACTION_ID') {
      return { interaction_id: interactionId || 'NO_INTERACTION_ID', messages: [] };
    }

    const encodedId = encodeURIComponent(interactionId);

    // Primary: Vite Reverse Proxy to Sarvam
    try {
      const proxyUrl = `/api/sarvam/api/analytics/v1/${SARVAM_ORG_ID}/${SARVAM_WORKSPACE_ID}/${SARVAM_AGENT_ID}/transcripts/${encodedId}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'X-API-Key': SARVAM_API_KEY
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Vite proxy transcript fetch error:', err);
    }

    // Secondary: FastAPI Backend
    try {
      const response = await fetch(`/api/v1/sarvam/transcripts/${encodedId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend unavailable
    }

    throw new Error('Unable to fetch transcript from Sarvam servers.');
  },

  /**
   * Triggers an instant outbound callback to a user's phone number
   */
  async triggerOutboundCall(phoneNumber) {
    if (!phoneNumber) throw new Error('Phone number is required');

    // Clean and validate
    let cleaned = phoneNumber.replace(/[^0-9+]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = `+91${cleaned}`;
      } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = `+${cleaned}`;
      }
    }

    const outboundPayload = {
      app_config: {
        app_id: SARVAM_AGENT_ID,
        app_version: 1,
        connection_config: {
          connection_id: SARVAM_CONNECTION_ID,
          agent_phone_number: SARVAM_PHONE_NUMBER.replace(/\s+/g, '')
        }
      },
      user_config: {
        user_phone_number: cleaned
      }
    };

    // Primary: Vite Proxy to Sarvam
    try {
      const targetUrl = `/api/sarvam/api/outbounds/v1/orgs/${SARVAM_ORG_ID}/workspaces/${SARVAM_WORKSPACE_ID}/outbounds`;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'X-API-Key': SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(outboundPayload)
      });

      if (res.ok) {
        const data = await res.json();
        return {
          status: 'success',
          attempt_id: data.attempt_id,
          recipient: cleaned,
          message: `Outbound call scheduled to ${cleaned}! The bot will ring your phone now.`
        };
      }
    } catch (err) {
      console.warn('Vite outbound proxy failed, checking backend...', err);
    }

    // Secondary: FastAPI Backend Proxy
    try {
      const response = await fetch('/api/v1/sarvam/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number: cleaned })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Backend proxy fallback
    }

    throw new Error('Failed to initiate outbound call. Please check your network and phone number.');
  },

  /**
   * Format duration in seconds into clean human string
   */
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '0s';
    const totalSecs = Math.round(Number(seconds));
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    const remSecs = totalSecs % 60;
    return `${mins}m ${remSecs}s`;
  },

  /**
   * Format ISO date string into readable Indian Standard Time
   */
  formatDate(dateStr) {
    if (!dateStr) return 'Recent Call';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch {
      return dateStr;
    }
  }
};
