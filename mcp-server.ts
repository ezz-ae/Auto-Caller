import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * MCP (Model Context Protocol) Server for Auto Caller Pro
 * 
 * This server allows AI assistants (Claude, ChatGPT, etc.) to control
 * the Auto Caller Pro application programmatically.
 * 
 * WHY MCP IS KEY TO THE BUSINESS MODEL:
 * =====================================
 * 
 * 1. NO INTEGRATION WORK FOR BUYERS
 *    - Buyers can use their existing AI assistant to control the app
 *    - No need to learn a new interface
 *    - "Hey Claude, call these 50 leads for me" just works
 * 
 * 2. VALUE MULTIPLIER
 *    - The app isn't just a standalone tool
 *    - It becomes part of the buyer's AI workflow
 *    - AI assistant + Auto Caller = Automated lead generation
 * 
 * 3. ZERO CODE DELIVERY
 *    - Buyers get the interface, not the codebase
 *    - MCP gives them CONTROL without OWNERSHIP
 *    - Protects your IP while maximizing utility
 * 
 * 4. COMPETITIVE MOAT
 *    - Most competitors sell just software
 *    - You're selling AI-controllable automation
 *    - The MCP layer is hard to replicate
 */

// MCP Protocol Handler
class MCPServer {
  tools = [
    {
      name: 'start_campaign',
      description: 'Start calling a list of phone numbers with AI voice. When someone answers, the call is forwarded to your phone.',
      inputSchema: {
        type: 'object',
        properties: {
          numbers: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of phone numbers to call (E.164 format preferred, e.g., +971501234567)'
          },
          script: {
            type: 'string',
            description: 'What the AI should say when they answer. Keep it conversational and include a question to engage them.'
          },
          voiceId: {
            type: 'string',
            description: 'Voice ID to use (optional). Defaults to Rachel (female). Use list_voices to see options.'
          },
          campaignName: {
            type: 'string',
            description: 'Optional name for this campaign'
          },
          record: {
            type: 'boolean',
            description: 'Whether to record calls (default: true)'
          },
          transcribe: {
            type: 'boolean',
            description: 'Whether to transcribe calls (default: true)'
          }
        },
        required: ['numbers', 'script']
      }
    },
    {
      name: 'stop_campaign',
      description: 'Stop the current calling campaign immediately',
      inputSchema: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'Campaign ID to stop (optional - stops current active campaign if not provided)'
          }
        }
      }
    },
    {
      name: 'get_status',
      description: 'Get current campaign status, credits remaining, and recent activity',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'configure',
      description: 'Set up API keys and phone number for the auto caller',
      inputSchema: {
        type: 'object',
        properties: {
          elevenLabsApiKey: { 
            type: 'string', 
            description: 'ElevenLabs API key for AI voice (get from elevenlabs.io)' 
          },
          twilioAccountSid: { 
            type: 'string', 
            description: 'Twilio Account SID' 
          },
          twilioAuthToken: { 
            type: 'string', 
            description: 'Twilio Auth Token' 
          },
          twilioPhoneNumber: { 
            type: 'string', 
            description: 'Your Twilio phone number (caller ID)' 
          },
          forwardToNumber: { 
            type: 'string', 
            description: 'Your phone number - where answered calls are forwarded' 
          },
          openaiApiKey: {
            type: 'string',
            description: 'OpenAI API key for transcription and analysis'
          },
          recordCalls: {
            type: 'boolean',
            description: 'Enable call recording (default: true)'
          },
          transcribeCalls: {
            type: 'boolean',
            description: 'Enable automatic transcription (default: true)'
          }
        }
      }
    },
    {
      name: 'list_voices',
      description: 'Get available AI voices for calling',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'add_credits',
      description: 'Add call credits to your account (for internal use)',
      inputSchema: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Number of credits to add'
          }
        },
        required: ['amount']
      }
    },
    {
      name: 'get_campaign_history',
      description: 'Get list of past campaigns and their results',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of campaigns to return (default: 10)'
          }
        }
      }
    },
    {
      name: 'get_campaign_details',
      description: 'Get detailed results for a specific campaign',
      inputSchema: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'Campaign ID to get details for'
          }
        },
        required: ['campaignId']
      }
    },
    {
      name: 'get_recordings',
      description: 'Get list of call recordings with optional transcript data',
      inputSchema: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'Filter by campaign ID (optional)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of recordings to return (default: 20)'
          }
        }
      }
    },
    {
      name: 'get_transcript',
      description: 'Get transcript for a specific recording',
      inputSchema: {
        type: 'object',
        properties: {
          recordingId: {
            type: 'string',
            description: 'Recording ID to get transcript for'
          }
        },
        required: ['recordingId']
      }
    },
    {
      name: 'transcribe_recording',
      description: 'Transcribe a recording using OpenAI Whisper for high-quality results',
      inputSchema: {
        type: 'object',
        properties: {
          recordingId: {
            type: 'string',
            description: 'Recording ID to transcribe'
          }
        },
        required: ['recordingId']
      }
    },
    {
      name: 'analyze_call',
      description: 'Analyze a call transcript for insights, sentiment, and action items',
      inputSchema: {
        type: 'object',
        properties: {
          recordingId: {
            type: 'string',
            description: 'Recording ID to analyze'
          },
          analysisType: {
            type: 'string',
            enum: ['summary', 'sentiment', 'action_items', 'all'],
            description: 'Type of analysis to perform (default: all)'
          }
        },
        required: ['recordingId']
      }
    },
    {
      name: 'search_transcripts',
      description: 'Search through all transcripts for keywords or phrases',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative'],
            description: 'Filter by sentiment (optional)'
          }
        },
        required: ['query']
      }
    }
  ];

  async apiRequest(endpoint: string, options: { method?: string; body?: unknown } = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, API_URL);
      
      const req = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data });
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async handleRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    switch (method) {
      case 'start_campaign':
        return this.apiRequest('/api/calls', { method: 'POST', body: params });
        
      case 'stop_campaign': {
        const campaignId = params.campaignId as string;
        return this.apiRequest(`/api/calls${campaignId ? `?id=${campaignId}` : ''}`, { method: 'DELETE' });
      }
        
      case 'get_status': {
        const settings = await this.apiRequest('/api/settings') as Record<string, unknown>;
        const campaigns = await this.apiRequest('/api/calls') as { campaigns?: Array<{ id: string; status: string; results?: unknown[] }> };
        const recordings = await this.apiRequest('/api/recordings') as { recordings?: unknown[] };
        const activeCampaign = campaigns.campaigns?.find(c => c.status === 'running');
        
        return {
          credits: settings.credits,
          isConfigured: settings.isConfigured,
          recordCalls: settings.recordCalls,
          transcribeCalls: settings.transcribeCalls,
          activeCampaign: activeCampaign ? {
            id: activeCampaign.id,
            status: activeCampaign.status,
            resultsCount: activeCampaign.results?.length || 0
          } : null,
          totalCampaigns: campaigns.campaigns?.length || 0,
          totalRecordings: recordings.recordings?.length || 0,
          message: activeCampaign 
            ? `Campaign ${activeCampaign.id} is running with ${activeCampaign.results?.length || 0} calls completed.`
            : 'No active campaign. Ready to start calling.'
        };
      }
      
      case 'configure':
        return this.apiRequest('/api/settings', { method: 'POST', body: params });
        
      case 'list_voices':
        return this.apiRequest('/api/voices');
        
      case 'add_credits':
        return this.apiRequest('/api/settings', { 
          method: 'POST', 
          body: { addCredits: params.amount } 
        });
        
      case 'get_campaign_history': {
        const campaigns = await this.apiRequest('/api/calls') as { campaigns?: unknown[] };
        const limit = (params.limit as number) || 10;
        return {
          campaigns: (campaigns.campaigns || []).slice(0, limit)
        };
      }
      
      case 'get_campaign_details':
        return this.apiRequest(`/api/calls?id=${params.campaignId}`);
        
      case 'get_recordings': {
        const limit = (params.limit as number) || 20;
        let endpoint = `/api/recordings?limit=${limit}`;
        if (params.campaignId) {
          endpoint += `&campaignId=${params.campaignId}`;
        }
        return this.apiRequest(endpoint);
      }
        
      case 'get_transcript':
        return this.apiRequest(`/api/transcriptions?recordingId=${params.recordingId}`);
        
      case 'transcribe_recording':
        return this.apiRequest('/api/transcriptions', { 
          method: 'POST', 
          body: { recordingId: params.recordingId, useOpenAI: true } 
        });
        
      case 'analyze_call': {
        const recording = await this.apiRequest(`/api/recordings?id=${params.recordingId}`) as { recording?: { transcript?: { text: string; summary?: string; sentiment?: string; actionItems?: string[] } } };
        
        if (!recording.recording?.transcript) {
          return { error: 'No transcript available. Transcribe the recording first.' };
        }
        
        const transcript = recording.recording.transcript;
        const analysisType = params.analysisType || 'all';
        
        switch (analysisType) {
          case 'summary':
            return { summary: transcript.summary || 'No summary available' };
          case 'sentiment':
            return { sentiment: transcript.sentiment || 'neutral' };
          case 'action_items':
            return { actionItems: transcript.actionItems || [] };
          default:
            return {
              summary: transcript.summary,
              sentiment: transcript.sentiment,
              actionItems: transcript.actionItems,
              text: transcript.text
            };
        }
      }
        
      case 'search_transcripts': {
        const query = (params.query as string).toLowerCase();
        const recordings = await this.apiRequest('/api/recordings') as { recordings?: Array<{ id: string; transcript?: { text: string; sentiment?: string } }> };
        
        const results = (recordings.recordings || [])
          .filter(r => {
            if (!r.transcript) return false;
            if (params.sentiment && r.transcript.sentiment !== params.sentiment) return false;
            return r.transcript.text.toLowerCase().includes(query);
          })
          .map(r => ({
            id: r.id,
            sentiment: r.transcript?.sentiment,
            excerpt: r.transcript?.text.substring(0, 200) + '...'
          }));
        
        return {
          query: params.query,
          count: results.length,
          results
        };
      }
        
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
}

// Start server
const server = new MCPServer();

// Handle stdin for MCP protocol
process.stdin.on('data', async (data) => {
  try {
    const message = JSON.parse(data.toString());
    
    if (message.method === 'tools/list') {
      console.log(JSON.stringify({ tools: server.tools }));
    } else if (message.method === 'tools/call') {
      const result = await server.handleRequest(
        message.params.name,
        message.params.arguments || {}
      );
      console.log(JSON.stringify({ result }));
    } else if (message.method === 'initialize') {
      console.log(JSON.stringify({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'auto-caller-pro',
          version: '1.0.0'
        }
      }));
    }
  } catch (error) {
    console.log(JSON.stringify({ error: (error as Error).message }));
  }
});

// Log to stderr (doesn't interfere with MCP protocol on stdout)
console.error('Auto Caller Pro MCP Server started');
console.error('Ready to accept AI assistant commands');
console.error('Features: Calling, Recording, Transcription, Analysis');
