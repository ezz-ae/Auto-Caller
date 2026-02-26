import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// == SKILL ENGINE ==

interface SkillParameter {
  name: string;
  type: string;
  description: string;
}

interface Skill {
  name: string;
  description: string;
  runtime: 'python' | 'typescript';
  entrypoint: string;
  parameters: SkillParameter[];
  output: {
    type: string;
    description: string;
  };
}

class SkillExecutor {
  constructor(private skillsDir: string) {}

  async execute(skill: Skill, params: Record<string, unknown>): Promise<string> {
    return new Promise((resolve, reject) => {
      const entrypointPath = path.join(this.skillsDir, skill.entrypoint);
      let cmd: string;
      let args: string[];

      const paramArgs = Object.entries(params).flatMap(([key, value]) => [`--${key}`, String(value)]);

      switch (skill.runtime) {
        case 'python':
          cmd = 'python3';
          args = [entrypointPath, ...paramArgs];
          break;
        case 'typescript':
          cmd = 'ts-node';
          args = [entrypointPath, ...paramArgs];
          break;
        default:
          return reject(new Error(`Unsupported runtime: ${skill.runtime}`));
      }

      console.error(`Executing skill: ${skill.name}`);
      console.error(`> ${cmd} ${args.join(' ')}`);

      const child = spawn(cmd, args, {
        cwd: path.dirname(entrypointPath)
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.error(`Skill ${skill.name} exited with code ${code}`);
          console.error('Stderr:', stderr);
          return reject(new Error(`Skill execution failed: ${stderr}`));
        }
        console.error(`Skill ${skill.name} completed successfully.`);
        console.error('Stdout:', stdout);
        resolve(stdout.trim());
      });

      child.on('error', (err) => {
        console.error(`Failed to start skill ${skill.name}:`, err);
        reject(err);
      });
    });
  }
}

async function loadSkills(skillsDir: string): Promise<Map<string, Skill>> {
    const skills = new Map<string, Skill>();
    if (!fs.existsSync(skillsDir)) {
        console.error(`Skills directory not found: ${skillsDir}`);
        return skills;
    }

    const entries = await fs.promises.readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const skillManifestPath = path.join(skillsDir, entry.name, 'skill.json');
            if (fs.existsSync(skillManifestPath)) {
                try {
                    const manifestContent = await fs.promises.readFile(skillManifestPath, 'utf-8');
                    const skill: Skill = JSON.parse(manifestContent);
                    skill.entrypoint = path.join(entry.name, skill.entrypoint);
                    skills.set(skill.name, skill);
                    console.error(`Loaded skill: ${skill.name}`);
                } catch (error) {
                    console.error(`Error loading skill from ${skillManifestPath}:`, error);
                }
            }
        }
    }
    return skills;
}


// == MCP SERVER ==

/**
 * MCP (Model Context Protocol) Server for Auto Caller Pro
 * This server now features a dynamic skill orchestrator alongside its
 * original API-bridging capabilities.
 */
class MCPServer {
  private skillExecutor: SkillExecutor;
  private skills: Map<string, Skill>;
  public tools: any[];

  constructor(skills: Map<string, Skill>, skillsDir: string) {
    this.skills = skills;
    this.skillExecutor = new SkillExecutor(skillsDir);

    const dynamicTools = Array.from(skills.values()).map(skill => ({
      name: skill.name,
      description: skill.description,
      inputSchema: {
        type: 'object',
        properties: skill.parameters.reduce((acc, param) => {
          acc[param.name] = { type: param.type, description: param.description };
          return acc;
        }, {} as Record<string, any>),
        required: skill.parameters.map(p => p.name),
      },
    }));
    
    this.tools = [...this.getBuiltInTools(), ...dynamicTools];
  }

  private getBuiltInTools() {
    return [
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
          deepgramApiKey: {
            type: 'string',
            description: 'Deepgram API key for real-time transcription'
          },
          webSocketUrl: {
            type: 'string',
            description: 'WebSocket URL for real-time transcription'
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
  }

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
    // Check if it's a dynamic skill
    const skill = this.skills.get(method);
    if (skill) {
      return this.skillExecutor.execute(skill, params);
    }

    // Fallback to built-in methods
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

async function main() {
    const skillsDir = path.join(process.cwd(), 'skills');
    const skills = await loadSkills(skillsDir);
    const server = new MCPServer(skills, skillsDir);

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
                        version: '1.1.0-orchestrator'
                    }
                }));
            }
        } catch (error) {
            console.log(JSON.stringify({ error: (error as Error).message }));
        }
    });

    console.error('Auto Caller Pro MCP Server started');
    console.error(`Loaded ${skills.size} dynamic skills.`);
    console.error('Ready to accept AI assistant commands');
}

main().catch(error => {
    console.error('Failed to start MCP server:', error);
});
