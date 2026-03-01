import { NextRequest, NextResponse } from 'next/server';

type AgentAction = 'none' | 'open_billing' | 'open_call' | 'open_callers' | 'open_settings';
type ConversationMode = 'onboarding' | 'execution' | 'optimization';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentContext {
  selectedAgentName?: string;
  credits?: number;
  numbersCount?: number;
  callerIdentityName?: string;
  callerIdentitiesCount?: number;
  activeCallerNumbers?: number;
  campaignCount?: number;
  currentCampaignName?: string;
  currentCampaignStatus?: string;
  totalCalls?: number;
  connectedCalls?: number;
  scheduledCallbacks?: number;
  dueCallbacks?: number;
  isCalling?: boolean;
  businessName?: string;
  industry?: string;
  companyDetails?: string;
  forwardToNumber?: string;
  sayThisRules?: string;
  avoidThisRules?: string;
  managedMode?: boolean;
  currentTab?: string;
  targetBlueprint?: string;
  currentCallerDraft?: Record<string, any>;
  currentLeadNotes?: string;
  currentSchedule?: string;
}

interface AgentFormDraft {
  settings?: {
    businessName?: string;
    industry?: string;
    companyDetails?: string;
    forwardToNumber?: string;
    sayThisRules?: string;
    avoidThisRules?: string;
  };
  callerIdentity?: {
    name?: string;
    position?: string;
    gender?: 'male' | 'female' | 'any';
    language?: string;
    voiceId?: string;
    industry?: string;
    mentionAi?: boolean;
    campaignGoal?: string;
    script?: string;
    sayThisRules?: string;
    avoidThisRules?: string;
  };
  callCenter?: {
    targetBlueprint?: string;
    numbers?: string;
    leadNotes?: string;
    scheduledAt?: string;
  };
  verificationQuestion?: string;
}

function clipText(input: unknown, max = 800): string {
  const value = String(input || '').replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}

function sanitizeGender(value: unknown): 'male' | 'female' | 'any' | undefined {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'male') return 'male';
  if (normalized === 'female') return 'female';
  if (normalized === 'any') return 'any';
  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (value === true) return true;
  if (value === false) return false;
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'true' || normalized === 'yes' || normalized === '1') return true;
  if (normalized === 'false' || normalized === 'no' || normalized === '0') return false;
  return undefined;
}

function sanitizeFormDraft(raw: unknown): AgentFormDraft | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const input = raw as Record<string, any>;
  const draft: AgentFormDraft = {};

  const settings = input.settings || {};
  const settingsDraft = {
    businessName: clipText(settings.businessName || '', 120),
    industry: clipText(settings.industry || '', 80),
    companyDetails: clipText(settings.companyDetails || '', 700),
    forwardToNumber: clipText(settings.forwardToNumber || '', 40),
    sayThisRules: clipText(settings.sayThisRules || '', 320),
    avoidThisRules: clipText(settings.avoidThisRules || '', 320),
  };
  if (Object.values(settingsDraft).some(Boolean)) {
    draft.settings = settingsDraft;
  }

  const callerIdentity = input.callerIdentity || {};
  const identityDraft = {
    name: clipText(callerIdentity.name || '', 80),
    position: clipText(callerIdentity.position || '', 80),
    gender: sanitizeGender(callerIdentity.gender),
    language: clipText(callerIdentity.language || '', 40),
    voiceId: clipText(callerIdentity.voiceId || '', 80),
    industry: clipText(callerIdentity.industry || '', 80),
    mentionAi: toBoolean(callerIdentity.mentionAi),
    campaignGoal: clipText(callerIdentity.campaignGoal || '', 240),
    script: clipText(callerIdentity.script || '', 900),
    sayThisRules: clipText(callerIdentity.sayThisRules || '', 320),
    avoidThisRules: clipText(callerIdentity.avoidThisRules || '', 320),
  };
  if (Object.values(identityDraft).some(value => value !== undefined && value !== '')) {
    draft.callerIdentity = identityDraft;
  }

  const callCenter = input.callCenter || {};
  const callCenterDraft = {
    targetBlueprint: clipText(callCenter.targetBlueprint || '', 1200),
    numbers: clipText(callCenter.numbers || '', 2000),
    leadNotes: clipText(callCenter.leadNotes || '', 1200),
    scheduledAt: clipText(callCenter.scheduledAt || '', 40),
  };
  if (Object.values(callCenterDraft).some(Boolean)) {
    draft.callCenter = callCenterDraft;
  }

  const verificationQuestion = clipText(input.verificationQuestion || '', 220);
  if (verificationQuestion) {
    draft.verificationQuestion = verificationQuestion;
  }

  if (!draft.settings && !draft.callerIdentity && !draft.callCenter && !draft.verificationQuestion) {
    return undefined;
  }
  return draft;
}

function normalizeGeminiModel(rawModel: string): string {
  const trimmed = String(rawModel || '').trim();
  if (!trimmed) return 'gemini-1.5-flash';
  return trimmed.replace(/^models\//i, '');
}

function extractJsonObject(raw: string): Record<string, any> {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response did not contain JSON');
    return JSON.parse(match[0]);
  }
}

function sanitizeAction(value: string): AgentAction {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'open_billing') return 'open_billing';
  if (normalized === 'open_call') return 'open_call';
  if (normalized === 'open_callers') return 'open_callers';
  if (normalized === 'open_settings') return 'open_settings';
  return 'none';
}

function inferSuggestedCredits(shortfall: number): number {
  if (shortfall <= 30) return 30;
  if (shortfall <= 60) return 60;
  if (shortfall <= 90) return 90;
  if (shortfall <= 140) return 140;
  return 200;
}

function sanitizeConfidence(value: unknown, fallback = 78): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(35, Math.min(98, Math.round(parsed)));
}

function inferConversationMode(context: AgentContext): ConversationMode {
  if (Number(context.callerIdentitiesCount || 0) === 0 || Number(context.campaignCount || 0) === 0) {
    return 'onboarding';
  }
  if ((context.currentCampaignStatus || '').toLowerCase() === 'running' || !!context.isCalling) {
    return 'execution';
  }
  return 'optimization';
}

async function generateJsonWithGemini(payload: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}) {
  const normalizedModel = normalizeGeminiModel(payload.model);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${encodeURIComponent(payload.apiKey)}`;

  const requestBodies = [
    {
      systemInstruction: {
        parts: [{ text: payload.systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: payload.userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
        maxOutputTokens: 1300,
      },
    },
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${payload.systemPrompt}\n\n${payload.userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1300,
      },
    },
  ];

  let lastError = '';
  for (const body of requestBodies) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      lastError = data?.error?.message || `Google AI request failed: ${response.status}`;
      continue;
    }

    const text = (data?.candidates || [])
      .flatMap((candidate: any) => candidate?.content?.parts || [])
      .map((part: any) => part?.text || '')
      .join('\n')
      .trim();

    if (!text) {
      lastError = 'Google AI returned an empty response';
      continue;
    }

    return extractJsonObject(text);
  }

  throw new Error(lastError || 'Google AI request failed');
}

function buildDeterministicReply(prompt: string, context: AgentContext) {
  const credits = Number(context.credits || 0);
  const numbersCount = Number(context.numbersCount || 0);
  const callerIdentitiesCount = Number(context.callerIdentitiesCount || 0);
  const agent = context.selectedAgentName || 'Sara';
  const mode = inferConversationMode(context);

  if (callerIdentitiesCount === 0) {
    return {
      reply: `${agent} here. Let’s create your first caller identity before launch. I recommend setting name, language, voice, and a clear target blueprint.`,
      action: 'open_callers' as AgentAction,
      checklist: [
        'Create first caller identity',
        'Set voice + language',
        'Add target blueprint and call rules',
      ],
      actionReason: 'No caller identity exists yet, so campaign launch cannot proceed.',
      confidence: 95,
      conversationMode: mode,
      formDraft: {
        callerIdentity: {
          name: context.selectedAgentName || 'Sara',
          position: 'Sales Advisor',
          gender: 'female',
          language: 'en-US',
          industry: context.industry || '',
          campaignGoal: 'Qualify leads and transfer warm prospects to human team',
          script: context.targetBlueprint || '',
        },
        verificationQuestion: 'Should I apply this caller identity draft to your inputs now?',
      } as AgentFormDraft,
    };
  }

  if (numbersCount > credits) {
    const shortfall = numbersCount - credits;
    const pack = inferSuggestedCredits(shortfall);
    return {
      reply: `${agent} here. You have ${credits} credits and ${numbersCount} contacts queued, so we are short by ${shortfall}. Add at least the ${pack}-credit pack, then launch from Call Center.`,
      action: 'open_billing' as AgentAction,
      checklist: [
        `Need ${numbersCount} credits for this list`,
        `Current credits: ${credits}`,
        `Suggested purchase: ${pack} credits`,
      ],
      actionReason: 'Queued contacts exceed current credits, which would block campaign dispatch.',
      confidence: 96,
      conversationMode: mode,
      formDraft: {
        callCenter: {
          targetBlueprint: context.targetBlueprint || '',
        },
        verificationQuestion: 'Do you want me to keep this call setup and move you to Billing for recharge?',
      } as AgentFormDraft,
    };
  }

  return {
    reply: `${agent} here. I captured your plan. Next, finalize the target blueprint, confirm caller identity assignment, and start the campaign. I can also format your report template if you tell me the exact fields.`,
    action: 'open_call' as AgentAction,
    checklist: [
      'Confirm target goal, audience, offer, qualification, CTA',
      'Assign caller identity to campaign',
      'Launch or schedule call batch',
    ],
    actionReason: 'Core setup appears valid. Next best step is execution from Call Center.',
    confidence: 84,
    conversationMode: mode,
    formDraft: {
      callCenter: {
        targetBlueprint: context.targetBlueprint || '',
      },
      verificationQuestion: 'Should I apply this blueprint to your Call Center inputs now?',
    } as AgentFormDraft,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = String(body?.prompt || '').trim();
    const messages = (body?.messages || []) as ChatMessage[];
    const context = (body?.context || {}) as AgentContext;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const credits = Number(context.credits || 0);
    const numbersCount = Number(context.numbersCount || 0);

    if (numbersCount > credits) {
      const deterministic = buildDeterministicReply(prompt, context);
      return NextResponse.json({
        success: true,
        ...deterministic,
      });
    }

    const apiKey = (
      process.env.MANAGED_GOOGLE_AI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      const deterministic = buildDeterministicReply(prompt, context);
      return NextResponse.json({ success: true, ...deterministic });
    }

    const model =
      normalizeGeminiModel(process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || '') ||
      'gemini-1.5-flash';

    const history = messages
      .slice(-10)
      .map(message => `${message.role === 'user' ? 'User' : 'Agent'}: ${message.content}`)
      .join('\n');

    const systemPrompt = `You are a proactive operations agent for an AI calling platform.
Speak naturally and clearly.
You help users configure:
- target blueprint
- call launch readiness
- reporting expectations
- credits and list feasibility

Always output strict JSON:
{
  "reply": "natural response",
  "action": "none|open_billing|open_call|open_callers|open_settings",
  "checklist": ["short step", "short step"],
  "actionReason": "short reason for the action",
  "confidence": 0-100,
  "conversationMode": "onboarding|execution|optimization",
  "formDraft": {
    "settings": {
      "businessName": "",
      "industry": "",
      "companyDetails": "",
      "forwardToNumber": "",
      "sayThisRules": "",
      "avoidThisRules": ""
    },
    "callerIdentity": {
      "name": "",
      "position": "",
      "gender": "male|female|any",
      "language": "en-US",
      "voiceId": "",
      "industry": "",
      "mentionAi": false,
      "campaignGoal": "",
      "script": "",
      "sayThisRules": "",
      "avoidThisRules": ""
    },
    "callCenter": {
      "targetBlueprint": "",
      "numbers": "",
      "leadNotes": "",
      "scheduledAt": ""
    },
    "verificationQuestion": "ask user for approval before applying"
  }
}`;

    const userPrompt = `Context:
- Agent name: ${context.selectedAgentName || 'Sara'}
- Workspace business: ${context.businessName || 'Not set'}
- Industry: ${context.industry || 'Not set'}
- Company details: ${context.companyDetails || 'Not set'}
- Forwarding number: ${context.forwardToNumber || 'Not set'}
- Global say rules: ${context.sayThisRules || 'Not set'}
- Global avoid rules: ${context.avoidThisRules || 'Not set'}
- Credits: ${credits}
- Contacts queued: ${numbersCount}
- Caller identities count: ${Number(context.callerIdentitiesCount || 0)}
- Caller numbers active: ${Number(context.activeCallerNumbers || 0)}
- Caller identity selected: ${context.callerIdentityName || 'No'}
- Campaign count: ${Number(context.campaignCount || 0)}
- Current campaign: ${context.currentCampaignName || 'None'} (${context.currentCampaignStatus || 'none'})
- Campaign running now: ${context.isCalling ? 'yes' : 'no'}
- Total calls: ${Number(context.totalCalls || 0)}
- Connected calls: ${Number(context.connectedCalls || 0)}
- Scheduled callbacks: ${Number(context.scheduledCallbacks || 0)}
- Due callbacks now: ${Number(context.dueCallbacks || 0)}
- Managed mode: ${context.managedMode ? 'yes' : 'no'}
- Current tab: ${context.currentTab || 'unknown'}
- Target blueprint: ${context.targetBlueprint || 'Not set'}
- Current caller draft: ${JSON.stringify(context.currentCallerDraft || {})}
- Current lead notes: ${context.currentLeadNotes || 'Not set'}
- Current schedule: ${context.currentSchedule || 'Not set'}

Conversation history:
${history || 'No previous history'}

User message:
${prompt}

Rules:
- If credits < contacts queued, action must be open_billing.
- If no caller identity exists yet, action must be open_callers.
- Recommend practical next steps, not abstract advice.
- Keep reply concise and conversational.
- Respond as an operations partner that is aware of the entire workspace.
- When user asks to create/fill/write/update values, provide a concrete formDraft with best-effort input values.
- Always include verificationQuestion when formDraft is present.`;

    try {
      const parsed = await generateJsonWithGemini({
        apiKey,
        model,
        systemPrompt,
        userPrompt,
      });

      return NextResponse.json({
        success: true,
        reply: String(parsed.reply || buildDeterministicReply(prompt, context).reply),
        action: sanitizeAction(String(parsed.action || 'none')),
        checklist: Array.isArray(parsed.checklist) ? parsed.checklist.map((x: any) => String(x)).filter(Boolean).slice(0, 6) : [],
        actionReason: String(parsed.actionReason || ''),
        confidence: sanitizeConfidence(parsed.confidence, 82),
        conversationMode: ['onboarding', 'execution', 'optimization'].includes(String(parsed.conversationMode || '').toLowerCase())
          ? String(parsed.conversationMode || '').toLowerCase()
          : inferConversationMode(context),
        formDraft: sanitizeFormDraft(parsed.formDraft),
        verificationQuestion: clipText(parsed.verificationQuestion || parsed.formDraft?.verificationQuestion || '', 220),
      });
    } catch (providerError) {
      console.error('Agent assistant provider fallback:', providerError);
      const deterministic = buildDeterministicReply(prompt, context);
      return NextResponse.json({ success: true, ...deterministic });
    }
  } catch (error) {
    console.error('Agent assistant error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run agent assistant',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
