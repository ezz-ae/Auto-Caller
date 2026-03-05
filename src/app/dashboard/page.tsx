'use client'

import { useState, useEffect, useCallback, useRef, useMemo, type ChangeEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Phone, 
  PhoneOff, 
  Upload, 
  Play, 
  Square, 
  Settings, 
  History, 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Volume2,
  Mic,
  FileText,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Download,
  Sparkles,
  Send,
  Bot,
  Wallet,
  BarChart3,
  ShieldCheck,
  Target,
  LogOut,
  UserPlus,
  Trash2,
  ClipboardList,
  CalendarClock,
  TimerReset,
  Plus
} from 'lucide-react'
import { StatCard } from './components/StatCard'
import { OverviewTab } from './components/OverviewTab'
import { VoiceAgentsTab } from './components/VoiceAgentsTab'
import { CallCenterTab } from './components/CallCenterTab'
import { LeadSourcesTab } from './components/LeadSourcesTab'
import { RecordingsTab } from './components/RecordingsTab'
import { LeadsTab } from './components/LeadsTab'
import { CallbacksTab } from './components/CallbacksTab'
import { HistoryTab } from './components/HistoryTab'
import { BillingTab } from './components/BillingTab'
import { SettingsTab } from './components/SettingsTab'
import { PayPalCheckoutModal } from '@/components/paypal/paypal-checkout-modal'
import { BrandLogo } from '@/components/brand-logo'

import { toast } from 'sonner'
import {
  buildCallbackQueue,
  buildDailyReport,
  buildLeadProfiles,
  buildWorkspaceIntelligence,
  type CallbackTask,
  type LeadProfile,
  type WorkspaceIntelligence,
} from '@/lib/call-center-intelligence'
import type { AgentAction, IntegrationActivityEvent } from '@/app/dashboard/types'

interface Settings {
  voiceEngineApiKey: string
  ttsProvider?: 'elevenlabs' | 'csm'
  csmEnabled?: boolean
  csmSpeaker?: number
  csmVoiceLabel?: string
  telephonyAccountSid: string
  telephonyAuthToken: string
  telephonyPhoneNumber: string
  forwardToNumber: string
  recordCalls: boolean
  transcribeCalls: boolean
  openaiApiKey: string
  managedMode?: boolean
  assignedPhoneNumber?: string
  businessName?: string
  industry?: string
  companyDetails?: string
  sayThisRules?: string
  avoidThisRules?: string
  includeAutomatedDisclosure?: boolean
}

interface Voice {
  id: string
  name: string
  category: string
  labels: Record<string, string>
  language?: string
  source?: string
  previewUrl?: string
}

interface Transcript {
  id: string
  text: string
  summary?: string
  sentiment?: string
  keywords?: string[]
  actionItems?: string[]
}

interface Recording {
  id: string
  callSid: string
  phoneNumber: string
  recordingUrl: string
  duration: number
  status: string
  transcript?: Transcript
  createdAt: string
}

interface CallResult {
  id: string
  phoneNumber: string
  status: string
  callAttemptState?: string
  attemptCount?: number
  billingEventId?: string
  billedAt?: string
  timestamp: string
  error?: string
  userComment?: string
  targetComment?: string
  callComment?: string
  leadSummary?: string
  leadRequest?: string
  followUpRequested?: boolean
  followUpAt?: string
  followUpStatus?: string
  followUpCampaignId?: string
}

interface Campaign {
  id: string
  name: string
  status: string
  numbers: string[]
  results: CallResult[]
  createdAt: string
  scheduledAt?: string
  script?: string
  voiceId?: string
  language?: string
  callerIdentityId?: string
  callerIdentityName?: string
  callerPosition?: string
}

interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
  script?: string
  objections?: string[]
  discoveryQuestions?: string[]
  conversationMoves?: string[]
}

interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  action?: AgentAction
  checklist?: string[]
  actionReason?: string
  confidence?: number
  conversationMode?: string
  formDraft?: AgentFormDraft
  verificationQuestion?: string
}

interface AgentFormDraft {
  settings?: {
    businessName?: string
    industry?: string
    companyDetails?: string
    forwardToNumber?: string
    sayThisRules?: string
    avoidThisRules?: string
  }
  callerIdentity?: {
    name?: string
    position?: string
    gender?: 'male' | 'female' | 'any'
    language?: string
    voiceId?: string
    industry?: string
    mentionAi?: boolean
    campaignGoal?: string
    script?: string
    sayThisRules?: string
    avoidThisRules?: string
  }
  callCenter?: {
    targetBlueprint?: string
    numbers?: string
    leadNotes?: string
    scheduledAt?: string
  }
  verificationQuestion?: string
}

interface UploadedChatFile {
  id: string
  name: string
  size: number
  kind: string
  snippet?: string
  importedNumbers?: number
}

interface AgentProfile {
  id: string
  name: string
  language: string
  style: string
  expertise: string
  intro: string
}

interface WorkspaceAgent {
  id: string
  profileId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

interface BillingProduct {
  id: string
  name: string
  price: number
  kind: 'credits' | 'number'
  credits?: number
}

interface BillingEventEntry {
  id: string
  kind: string
  amount: number
  status: string
  metadata?: Record<string, any>
  createdAt: string
}

interface TtsHealthStatus {
  provider: 'elevenlabs' | 'csm'
  status: 'ready' | 'disabled' | 'unreachable' | 'gpu_missing' | 'loading'
  detail?: string
  modelId?: string
}

interface LeadSourceSettingsState {
  zapierEnabled: boolean
  zapierInboundSecret: string
  zapierWebhookUrl: string
  googleDriveEnabled: boolean
  googleDriveCsvUrl: string
  googleDriveAutoSync: boolean
  inboxNewCount: number
  inboxConsumedCount: number
}

interface CallerIdentity {
  id: string
  name: string
  position: string
  gender: string
  language: string
  voiceId: string
  dedicatedNumber?: string
  industry?: string
  mentionAi: boolean
  script: string
  sayThisRules?: string
  avoidThisRules?: string
  totalCalls: number
  connectedCalls: number
  failedCalls: number
  noAnswerCalls: number
  campaignsLaunched: number
  creditsUsed: number
  lastCalledAt?: string
  createdAt: string
}

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese (BR)' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'tr-TR', label: 'Turkish' },
]

const DEFAULT_BILLING_PRODUCTS: Record<string, BillingProduct> = {
  credits_30: { id: 'credits_30', name: '30 Credits Pack', price: 1.2, kind: 'credits', credits: 30 },
  credits_60: { id: 'credits_60', name: '60 Credits Pack', price: 2.4, kind: 'credits', credits: 60 },
  credits_90: { id: 'credits_90', name: '90 Credits Pack', price: 3.6, kind: 'credits', credits: 90 },
  credits_140: { id: 'credits_140', name: '140 Credits Pack', price: 5.6, kind: 'credits', credits: 140 },
  credits_200: { id: 'credits_200', name: '200 Credits Pack', price: 8, kind: 'credits', credits: 200 },
  number_activation: { id: 'number_activation', name: 'Dedicated Phone Number', price: 39, kind: 'number' },
}

const DEFAULT_FEMALE_VOICE_FALLBACK = '21m00Tcm4TlvDq8ikWAM' // Rachel
const DEFAULT_MALE_VOICE_FALLBACK = 'ErXwobaYiN019PkySvjV' // Antoni

const PREFERRED_ELEVENLABS_VOICES: Record<'female' | 'male', string[]> = {
  female: [DEFAULT_FEMALE_VOICE_FALLBACK, 'AZnzlk1XvdvUeBnXmlld', 'EXAVITQu4vr4xnSDxMaL', 'MF3mGyEYCl7XYWbV9V6O'],
  male: [DEFAULT_MALE_VOICE_FALLBACK, 'TxGEqnHWrfWFT1GWmBXj', 'pNInz6obpgDQGcFmaJgB', 'VR6AewLTigWG4xSOukaG'],
}

const AGENT_CATALOG: AgentProfile[] = [
  {
    id: 'sara',
    name: 'Sara',
    language: 'English',
    style: 'Friendly and confident',
    expertise: 'Closing and conversions',
    intro: 'Best for warm leads and turning conversations into booked meetings.',
  },
  {
    id: 'ali',
    name: 'Ali',
    language: 'Arabic',
    style: 'Polite and assertive',
    expertise: 'Follow-up and reactivation',
    intro: 'Best for Arabic outreach, callback handling, and lead re-engagement.',
  },
]

const AGENT_ADMIN_PRESETS: Record<string, { voiceId: string; language: string; gender: 'male' | 'female' | 'any'; position: string }> = {
  sara: { voiceId: DEFAULT_FEMALE_VOICE_FALLBACK, language: 'en-US', gender: 'female', position: 'Sales Advisor' },
  ali: { voiceId: DEFAULT_MALE_VOICE_FALLBACK, language: 'ar-SA', gender: 'male', position: 'Follow-up Specialist' },
  maya: { voiceId: DEFAULT_FEMALE_VOICE_FALLBACK, language: 'en-US', gender: 'female', position: 'Qualification Specialist' },
  omar: { voiceId: 'TxGEqnHWrfWFT1GWmBXj', language: 'ar-SA', gender: 'male', position: 'Appointment Specialist' },
  lina: { voiceId: DEFAULT_FEMALE_VOICE_FALLBACK, language: 'en-US', gender: 'female', position: 'Retention Specialist' },
  noah: { voiceId: 'pNInz6obpgDQGcFmaJgB', language: 'en-GB', gender: 'male', position: 'Enterprise Specialist' },
}

function normalizeGender(gender?: string): 'female' | 'male' | 'any' {
  const value = String(gender || '').trim().toLowerCase()
  if (value.includes('female')) return 'female'
  if (value.includes('male')) return 'male'
  return 'any'
}

function languageBase(value?: string): string {
  return String(value || '').trim().toLowerCase().split('-')[0] || ''
}

function isNaturalVoice(voice?: Voice | null): boolean {
  if (!voice) return false
  return voice.source === 'elevenlabs' || voice.source === 'high-quality'
}

function isRiverVoice(voice?: Voice | null): boolean {
  if (!voice) return false
  const name = String(voice.name || '').trim().toLowerCase()
  return name === 'river' || name.startsWith('river ')
}

function scoreVoiceForIdentity(voice: Voice, targetGender: 'female' | 'male' | 'any', targetLanguage: string): number {
  const voiceGender = normalizeGender(voice.labels?.gender)
  const voiceLanguage = String(voice.language || voice.labels?.language || '').trim().toLowerCase()
  const voiceLanguageBase = languageBase(voiceLanguage)
  const targetLanguageNormalized = targetLanguage.trim().toLowerCase()
  const targetLanguageBase = languageBase(targetLanguageNormalized)

  let score = 0

  if (isNaturalVoice(voice)) score += 120
  if (voice.category === 'premade') score += 25

  if (targetGender === 'any') {
    score += 20
  } else if (voiceGender === targetGender) {
    score += 200
  } else if (voiceGender === 'any') {
    score += 10
  } else {
    score -= 300
  }

  if (!voiceLanguage || voiceLanguage === 'multi') {
    score += 20
  } else if (voiceLanguage === targetLanguageNormalized) {
    score += 120
  } else if (voiceLanguageBase && voiceLanguageBase === targetLanguageBase) {
    score += 80
  } else {
    score -= 120
  }

  const preferredForGender = targetGender === 'any' ? [] : PREFERRED_ELEVENLABS_VOICES[targetGender]
  if (preferredForGender.includes(voice.id)) {
    score += 120
  }

  const description = String(voice.labels?.description || '').toLowerCase()
  if (description.includes('natural') || description.includes('realistic') || description.includes('warm')) {
    score += 20
  }
  if (isRiverVoice(voice)) {
    score += 60
    if (targetGender === 'female') score += 160
    if (targetLanguageBase === 'en') score += 50
  }

  return score
}

function resolveDefaultFemaleVoiceId(voices: Voice[]): string {
  const naturalVoices = voices.filter(voice => isNaturalVoice(voice))
  const pool = naturalVoices.length > 0 ? naturalVoices : voices
  const riverVoice = pool.find(voice => {
    const voiceGender = normalizeGender(voice.labels?.gender)
    const voiceLanguageBase = languageBase(String(voice.language || voice.labels?.language || ''))
    return isRiverVoice(voice) && (voiceGender === 'female' || voiceGender === 'any') && (!voiceLanguageBase || voiceLanguageBase === 'en')
  })
  if (riverVoice) return riverVoice.id

  const fallbackCandidate = pool
    .filter(voice => {
      const voiceGender = normalizeGender(voice.labels?.gender)
      return voiceGender === 'female' || voiceGender === 'any'
    })
    .sort((a, b) => scoreVoiceForIdentity(b, 'female', 'en-US') - scoreVoiceForIdentity(a, 'female', 'en-US'))[0]

  return fallbackCandidate?.id || DEFAULT_FEMALE_VOICE_FALLBACK
}

function resolveDefaultVoiceForPreset(
  preset: { voiceId: string; language: string; gender: 'male' | 'female' | 'any' },
  voices: Voice[]
): string {
  const naturalVoices = voices.filter(voice => isNaturalVoice(voice))
  const pool = naturalVoices.length > 0 ? naturalVoices : voices

  if (preset.gender === 'female') {
    return resolveDefaultFemaleVoiceId(pool)
  }

  if (pool.some(voice => voice.id === preset.voiceId)) {
    return preset.voiceId
  }

  const ranked = pool
    .filter(voice => {
      const voiceGender = normalizeGender(voice.labels?.gender)
      return preset.gender === 'any' || voiceGender === 'any' || voiceGender === preset.gender
    })
    .sort((a, b) => scoreVoiceForIdentity(b, preset.gender, preset.language) - scoreVoiceForIdentity(a, preset.gender, preset.language))

  return ranked[0]?.id || (preset.gender === 'male' ? DEFAULT_MALE_VOICE_FALLBACK : DEFAULT_FEMALE_VOICE_FALLBACK)
}

function parseCsmSpeakerFromVoiceId(voiceId?: string): number | null {
  const match = String(voiceId || '').trim().match(/^csm_speaker_(\d+)$/i)
  if (!match) return null
  const parsed = Number(match[1])
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.floor(parsed)
}

export default function Dashboard() {
  // Settings state
  const [settings, setSettings] = useState<Settings>({
    voiceEngineApiKey: '',
    ttsProvider: 'elevenlabs',
    csmEnabled: false,
    csmSpeaker: 0,
    csmVoiceLabel: '',
    telephonyAccountSid: '',
    telephonyAuthToken: '',
    telephonyPhoneNumber: '',
    forwardToNumber: '',
    recordCalls: true,
    transcribeCalls: true,
    openaiApiKey: '',
    managedMode: true,
    assignedPhoneNumber: '',
    businessName: '',
    industry: '',
    companyDetails: '',
    sayThisRules: '',
    avoidThisRules: '',
    includeAutomatedDisclosure: true,
  })
  const [credits, setCredits] = useState(0)
  const [isConfigured, setIsConfigured] = useState(false)
  const [managedMode, setManagedMode] = useState(true)
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState('')
  
  // Call state
  const [numbers, setNumbers] = useState('')
  const [leadNotesText, setLeadNotesText] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [script, setScript] = useState([
    'Goal: qualify lead and transfer to human agent',
    'Audience: potential buyers',
    'Offer: relevant update about our latest launch',
    'Qualification: need, budget, timeline, decision maker',
    'CTA: connect now with specialist',
  ].join('\n'))
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_FEMALE_VOICE_FALLBACK)
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [voices, setVoices] = useState<Voice[]>([])
  const [callerIdentities, setCallerIdentities] = useState<CallerIdentity[]>([])
  const [selectedCallerIdentityId, setSelectedCallerIdentityId] = useState('')
  const [identityForm, setIdentityForm] = useState({
    name: '',
    position: '',
    gender: 'any',
    language: 'en-US',
    voiceId: DEFAULT_FEMALE_VOICE_FALLBACK,
    industry: '',
    mentionAi: false,
    campaignGoal: '',
    script: '',
    sayThisRules: '',
    avoidThisRules: '',
  })
  const [identityLoading, setIdentityLoading] = useState(false)
  const [editingCallerIdentityId, setEditingCallerIdentityId] = useState<string | null>(null)
  const [voicePreviewText, setVoicePreviewText] = useState('Hi, this is Sara from Callware. I wanted to share a quick update and see if this is relevant for you.')
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  
  // Campaign state
  const [isCalling, setIsCalling] = useState(false)
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  
  // Recordings state
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)
  const [transcribing, setTranscribing] = useState<string | null>(null)
  const [recordingSearch, setRecordingSearch] = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const voicePreviewAudioRef = useRef<HTMLAudioElement>(null)
  const agentVoiceAudioRef = useRef<HTMLAudioElement>(null)
  const agentRecognitionRef = useRef<any>(null)
  const agentFileInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState('agents')
  const [leadSearch, setLeadSearch] = useState('')
  const [callbackFilter, setCallbackFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [ttsConfigSaving, setTtsConfigSaving] = useState(false)
  const [numberPurchaseModal, setNumberPurchaseModal] = useState<{ callerIdentityId: string; identityName: string } | null>(null)
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([])
  const [copilotInput, setCopilotInput] = useState('')
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [agentProfiles] = useState<AgentProfile[]>(AGENT_CATALOG)
  const [workspaceAgents, setWorkspaceAgents] = useState<WorkspaceAgent[]>([])
  const [activeAgentId, setActiveAgentId] = useState('')
  const [agentSessionStarted, setAgentSessionStarted] = useState(false)
  const [agentMessagesByAgent, setAgentMessagesByAgent] = useState<Record<string, AgentMessage[]>>({})
  const [agentInput, setAgentInput] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentUploads, setAgentUploads] = useState<UploadedChatFile[]>([])
  const [selectedLeadList, setSelectedLeadList] = useState('Default List')
  const [newLeadListName, setNewLeadListName] = useState('')
  const [leadListContexts, setLeadListContexts] = useState<Record<string, {
    offer: string
    goal: string
    notes: string
  }>>({})
  const [contentInput, setContentInput] = useState({
    offer: '',
    goal: '',
    notes: '',
  })
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false)
  const [liveVoiceCallEnabled, setLiveVoiceCallEnabled] = useState(false)
  const [agentListening, setAgentListening] = useState(false)
  const [agentSpeaking, setAgentSpeaking] = useState(false)
  const [showAdvancedCallerInputs, setShowAdvancedCallerInputs] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamForm, setTeamForm] = useState({ name: '', email: '', role: 'Agent' })
  const [teamLoading, setTeamLoading] = useState(false)
  const [complianceLeadNumber, setComplianceLeadNumber] = useState('')
  const [complianceLoading, setComplianceLoading] = useState(false)
  const [billingProducts, setBillingProducts] = useState<Record<string, BillingProduct>>(DEFAULT_BILLING_PRODUCTS)
  const [billingEvents, setBillingEvents] = useState<BillingEventEntry[]>([])
  const [testingCall, setTestingCall] = useState(false)
  const [ttsHealth, setTtsHealth] = useState<TtsHealthStatus | null>(null)
  const [loadingTtsHealth, setLoadingTtsHealth] = useState(false)
  const [leadSourceSettings, setLeadSourceSettings] = useState<LeadSourceSettingsState>({
    zapierEnabled: true,
    zapierInboundSecret: '',
    zapierWebhookUrl: '',
    googleDriveEnabled: false,
    googleDriveCsvUrl: '',
    googleDriveAutoSync: false,
    inboxNewCount: 0,
    inboxConsumedCount: 0,
  })
  const [integrationEvents, setIntegrationEvents] = useState<IntegrationActivityEvent[]>([])
  const [savingLeadSources, setSavingLeadSources] = useState(false)
  const [syncingGoogleDrive, setSyncingGoogleDrive] = useState(false)
  const [loadingLeadInbox, setLoadingLeadInbox] = useState(false)
  const initRef = useRef(false)
  const defaultVoiceAppliedRef = useRef(false)
  const liveResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/calls')
      if (!res.ok) {
        throw new Error('Failed to load campaigns')
      }
      const data = await res.json()
      const loadedCampaigns = data.campaigns || []
      setCampaigns(loadedCampaigns)

      const active =
        loadedCampaigns.find((c: Campaign) => c.status === 'running') ||
        loadedCampaigns.find((c: Campaign) => c.status === 'scheduled')
      setCurrentCampaign(active || null)
      setIsCalling(active?.status === 'running')
    } catch {
      console.error('Failed to load campaigns')
    }
  }, [])

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch('/api/recordings')
      if (!res.ok) {
        throw new Error('Failed to load recordings')
      }
      const data = await res.json()
      setRecordings(data.recordings || [])
    } catch {
      console.error('Failed to load recordings')
    }
  }, [])

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team-members')
      if (!res.ok) {
        throw new Error('Failed to load team members')
      }
      const data = await res.json()
      setTeamMembers(data.members || [])
    } catch {
      console.error('Failed to load team members')
    }
  }, [])

  const fetchBillingProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/paypal/create-order')
      if (!res.ok) {
        throw new Error('Failed to load billing products')
      }
      const data = await res.json()
      const products = Array.isArray(data.products) ? data.products : []
      if (products.length === 0) return

      const mapped = products.reduce((acc: Record<string, BillingProduct>, product: BillingProduct) => {
        if (product?.id) {
          acc[product.id] = product
        }
        return acc
      }, {})

      if (Object.keys(mapped).length > 0) {
        setBillingProducts(prev => ({ ...prev, ...mapped }))
      }
    } catch {
      console.error('Failed to load billing products')
    }
  }, [])

  const fetchBillingEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/events?limit=12')
      if (!res.ok) {
        throw new Error('Failed to load billing events')
      }
      const data = await res.json()
      setBillingEvents(Array.isArray(data?.events) ? data.events : [])
    } catch {
      console.error('Failed to load billing events')
    }
  }, [])

  const fetchTtsHealth = useCallback(async () => {
    setLoadingTtsHealth(true)
    try {
      const res = await fetch('/api/tts-health')
      if (!res.ok) {
        throw new Error('Failed to load TTS health')
      }
      const data = await res.json()
      if (data?.provider) {
        setTtsHealth(data as TtsHealthStatus)
      }
    } catch {
      setTtsHealth(null)
    } finally {
      setLoadingTtsHealth(false)
    }
  }, [])

  const fetchLeadSources = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/sources')
      if (!res.ok) {
        throw new Error('Failed to load lead sources')
      }

      const data = await res.json()
      setLeadSourceSettings({
        zapierEnabled: !!data?.settings?.zapierEnabled,
        zapierInboundSecret: String(data?.settings?.zapierInboundSecret || ''),
        zapierWebhookUrl: String(data?.webhookUrl || ''),
        googleDriveEnabled: !!data?.settings?.googleDriveEnabled,
        googleDriveCsvUrl: String(data?.settings?.googleDriveCsvUrl || ''),
        googleDriveAutoSync: !!data?.settings?.googleDriveAutoSync,
        inboxNewCount: Number(data?.inbox?.newCount || 0),
        inboxConsumedCount: Number(data?.inbox?.consumedCount || 0),
      })
      setIntegrationEvents(Array.isArray(data?.events) ? data.events : [])
    } catch {
      console.error('Failed to load lead sources')
    }
  }, [])

  const fetchCallerIdentities = useCallback(async () => {
    try {
      const res = await fetch('/api/caller-identities')
      if (!res.ok) {
        throw new Error('Failed to load caller identities')
      }
      const data = await res.json()
      setCallerIdentities(data.identities || [])
    } catch {
      console.error('Failed to load caller identities')
    }
  }, [])

  const addTeamMember = async () => {
    if (!teamForm.name.trim() || !teamForm.email.trim() || !teamForm.role.trim()) {
      toast.error('Name, email, and role are required')
      return
    }

    setTeamLoading(true)
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamForm.name.trim(),
          email: teamForm.email.trim(),
          role: teamForm.role.trim(),
          active: true,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to add team member')
        return
      }

      setTeamForm({ name: '', email: '', role: 'Agent' })
      await fetchTeamMembers()
      toast.success('Team member added')
    } catch {
      toast.error('Failed to add team member')
    } finally {
      setTeamLoading(false)
    }
  }

  const selectedCallerIdentity = useMemo(
    () => callerIdentities.find(identity => identity.id === selectedCallerIdentityId) || null,
    [callerIdentities, selectedCallerIdentityId]
  )

  const identityVoicePool = useMemo(() => {
    const elevenVoices = voices.filter(voice => isNaturalVoice(voice))
    return elevenVoices.length > 0 ? elevenVoices : voices
  }, [voices])

  const filteredIdentityVoices = useMemo(() => {
    const targetGender = normalizeGender(identityForm.gender)
    const targetLanguage = identityForm.language.toLowerCase()
    const targetLanguageBase = targetLanguage.split('-')[0]

    return identityVoicePool
      .filter(voice => {
      const voiceGender = normalizeGender(voice.labels?.gender)
      const voiceLanguage = String(voice.language || voice.labels?.language || '').toLowerCase()
      const voiceLanguageBase = voiceLanguage.split('-')[0]

      const genderMatch = targetGender === 'any' || voiceGender === 'any' || voiceGender === targetGender
      const languageMatch =
        !voiceLanguage ||
        voiceLanguage === 'multi' ||
        voiceLanguage === targetLanguage ||
        voiceLanguageBase === targetLanguageBase

      return genderMatch && languageMatch
    })
      .sort((a, b) => scoreVoiceForIdentity(b, targetGender, targetLanguage) - scoreVoiceForIdentity(a, targetGender, targetLanguage))
  }, [identityForm.gender, identityForm.language, identityVoicePool])

  const selectedIdentityVoice = useMemo(
    () => filteredIdentityVoices.find(voice => voice.id === identityForm.voiceId) || null,
    [filteredIdentityVoices, identityForm.voiceId]
  )

  useEffect(() => {
    if (filteredIdentityVoices.length === 0) return
    if (filteredIdentityVoices.some(voice => voice.id === identityForm.voiceId)) return

    setIdentityForm(prev => ({
      ...prev,
      voiceId: filteredIdentityVoices[0].id,
    }))
  }, [filteredIdentityVoices, identityForm.voiceId])

  const applyIdentityToComposer = (identity: CallerIdentity) => {
    setSelectedCallerIdentityId(identity.id)
    setSelectedVoice(identity.voiceId || selectedVoice)
    setSelectedLanguage(identity.language || 'en-US')
    if (identity.script?.trim()) {
      setScript(identity.script)
    }
    toast.success(`${identity.name} is now active`)
  }

  const resetCallerIdentityForm = () => {
    setEditingCallerIdentityId(null)
    setShowAdvancedCallerInputs(false)
    setIdentityForm({
      name: '',
      position: '',
      gender: 'any',
      language: selectedLanguage,
      voiceId: selectedVoice,
      industry: settings.industry || '',
      mentionAi: false,
      campaignGoal: '',
      script: '',
      sayThisRules: settings.sayThisRules || '',
      avoidThisRules: settings.avoidThisRules || '',
    })
  }

  const editCallerIdentity = (identity: CallerIdentity) => {
    setEditingCallerIdentityId(identity.id)
    setShowAdvancedCallerInputs(true)
    setIdentityForm({
      name: identity.name || '',
      position: identity.position || '',
      gender: identity.gender || 'any',
      language: identity.language || 'en-US',
      voiceId: identity.voiceId || (settings.ttsProvider === 'csm'
        ? `csm_speaker_${Math.max(0, Math.floor(Number(settings.csmSpeaker || 0)))}`
        : DEFAULT_FEMALE_VOICE_FALLBACK),
      industry: identity.industry || '',
      mentionAi: !!identity.mentionAi,
      campaignGoal: '',
      script: identity.script || '',
      sayThisRules: identity.sayThisRules || '',
      avoidThisRules: identity.avoidThisRules || '',
    })
    setActiveTab('callers')
    toast.success(`Editing ${identity.name}`)
  }

  const saveCallerIdentity = async () => {
    if (!identityForm.name.trim() || !identityForm.position.trim()) {
      toast.error('Identity name and position are required')
      return
    }

    setIdentityLoading(true)
    try {
      const res = await fetch('/api/caller-identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCallerIdentityId || undefined,
          name: identityForm.name.trim(),
          position: identityForm.position.trim(),
          gender: identityForm.gender,
          language: identityForm.language,
          voiceId: identityForm.voiceId,
          industry: identityForm.industry.trim(),
          mentionAi: identityForm.mentionAi,
          campaignGoal: identityForm.campaignGoal.trim(),
          script: identityForm.script.trim(),
          sayThisRules: identityForm.sayThisRules.trim(),
          avoidThisRules: identityForm.avoidThisRules.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to save caller identity')
        return
      }

      const identity = data.identity as CallerIdentity
      await fetchCallerIdentities()
      resetCallerIdentityForm()
      applyIdentityToComposer(identity)
      toast.success(editingCallerIdentityId ? 'Caller identity updated' : 'Caller identity created')
    } catch {
      toast.error('Failed to save caller identity')
    } finally {
      setIdentityLoading(false)
    }
  }

  const removeCallerIdentity = async (id: string) => {
    setIdentityLoading(true)
    try {
      const res = await fetch(`/api/caller-identities?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to delete caller identity')
        return
      }

      if (selectedCallerIdentityId === id) {
        setSelectedCallerIdentityId('')
      }
      if (editingCallerIdentityId === id) {
        resetCallerIdentityForm()
      }
      await fetchCallerIdentities()
      toast.success('Caller identity removed')
    } catch {
      toast.error('Failed to delete caller identity')
    } finally {
      setIdentityLoading(false)
    }
  }

  const previewIdentityVoice = async (voiceId?: string, language?: string) => {
    const chosenVoiceId = voiceId || identityForm.voiceId
    const chosenLanguage = language || identityForm.language || selectedLanguage
    const text = voicePreviewText.trim()

    if (!chosenVoiceId) {
      toast.error('Select a voice first')
      return
    }
    if (!text) {
      toast.error('Add preview text first')
      return
    }

    const voice = voices.find(v => v.id === chosenVoiceId)
    if (!voice) {
      toast.error('Voice not found')
      return
    }

    if (settings.ttsProvider !== 'csm' && !isNaturalVoice(voice)) {
      toast.error('Preview is available for high-quality natural voices. Choose a natural voice for testing.')
      return
    }

    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause()
      voicePreviewAudioRef.current.currentTime = 0
    }

    setPreviewingVoice(chosenVoiceId)
    try {
      const formatParam = settings.ttsProvider === 'csm' ? '&format=wav' : ''
      const url = `/api/calls/tts?script=${encodeURIComponent(text)}&voiceId=${encodeURIComponent(chosenVoiceId)}&language=${encodeURIComponent(chosenLanguage)}${formatParam}`
      if (voicePreviewAudioRef.current) {
        voicePreviewAudioRef.current.src = url
        await voicePreviewAudioRef.current.play()
      }
    } catch {
      toast.error('Failed to play voice preview')
      setPreviewingVoice(null)
    }
  }

  const toggleTeamMember = async (member: TeamMember) => {
    setTeamLoading(true)
    try {
      const res = await fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          active: !member.active,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to update team member')
        return
      }

      await fetchTeamMembers()
    } catch {
      toast.error('Failed to update team member')
    } finally {
      setTeamLoading(false)
    }
  }

  const removeTeamMember = async (id: string) => {
    setTeamLoading(true)
    try {
      const res = await fetch(`/api/team-members?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to remove team member')
        return
      }

      await fetchTeamMembers()
      toast.success('Team member removed')
    } catch {
      toast.error('Failed to remove team member')
    } finally {
      setTeamLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedActiveWorkspaceAgentId = window.localStorage.getItem('acaller.activeWorkspaceAgentId')
    const storedWorkspaceAgents = window.localStorage.getItem('acaller.workspaceAgents')
    const storedMessagesMap = window.localStorage.getItem('acaller.agentMessagesByAgent')
    const legacyStoredAgentId = window.localStorage.getItem('acaller.activeAgentId')
    const legacyStoredMessages = window.localStorage.getItem('acaller.agentMessages')
    const storedSessionState = window.localStorage.getItem('acaller.agentSessionStarted')

    const parsedWorkspaceAgents: WorkspaceAgent[] = (() => {
      if (!storedWorkspaceAgents) return []
      try {
        const parsed = JSON.parse(storedWorkspaceAgents) as WorkspaceAgent[]
        if (!Array.isArray(parsed)) return []
        return parsed.filter(item => item?.id && item?.profileId && item?.name && agentProfiles.some(profile => profile.id === item.profileId))
      } catch {
        return []
      }
    })()
    setWorkspaceAgents(parsedWorkspaceAgents)

    const parsedMessagesMap: Record<string, AgentMessage[]> = (() => {
      if (!storedMessagesMap) return {}
      try {
        const parsed = JSON.parse(storedMessagesMap) as Record<string, AgentMessage[]>
        if (!parsed || typeof parsed !== 'object') return {}
        return parsed
      } catch {
        return {}
      }
    })()
    setAgentMessagesByAgent(parsedMessagesMap)

    if (storedActiveWorkspaceAgentId && parsedWorkspaceAgents.some(agent => agent.id === storedActiveWorkspaceAgentId)) {
      setActiveAgentId(storedActiveWorkspaceAgentId)
    } else if (parsedWorkspaceAgents[0]?.id) {
      setActiveAgentId(parsedWorkspaceAgents[0].id)
    } else if (legacyStoredAgentId && agentProfiles.some(profile => profile.id === legacyStoredAgentId)) {
      const profile = agentProfiles.find(item => item.id === legacyStoredAgentId) || agentProfiles[0]
      const seededId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const seededAgent: WorkspaceAgent = {
        id: seededId,
        profileId: profile?.id || 'sara',
        name: profile?.name || 'Sara',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setWorkspaceAgents([seededAgent])
      setActiveAgentId(seededId)

      if (legacyStoredMessages) {
        try {
          const parsedLegacyMessages = JSON.parse(legacyStoredMessages) as AgentMessage[]
          if (Array.isArray(parsedLegacyMessages) && parsedLegacyMessages.length > 0) {
            setAgentMessagesByAgent({ [seededId]: parsedLegacyMessages })
          }
        } catch {
          // ignore malformed legacy data
        }
      }
    }

    if (storedSessionState === '1') {
      setAgentSessionStarted(true)
    }
  }, [agentProfiles])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('acaller.workspaceAgents', JSON.stringify(workspaceAgents))
    window.localStorage.setItem('acaller.agentMessagesByAgent', JSON.stringify(agentMessagesByAgent))
    window.localStorage.setItem('acaller.activeWorkspaceAgentId', activeAgentId)
    window.localStorage.setItem('acaller.agentSessionStarted', agentSessionStarted ? '1' : '0')
  }, [workspaceAgents, agentMessagesByAgent, activeAgentId, agentSessionStarted])

  useEffect(() => {
    if (!agentSessionStarted && workspaceAgents.length > 0) {
      setAgentSessionStarted(true)
    }
  }, [workspaceAgents.length, agentSessionStarted])

  useEffect(() => {
    if (workspaceAgents.length === 0) {
      if (activeAgentId) setActiveAgentId('')
      if (liveVoiceCallEnabled) {
        setLiveVoiceCallEnabled(false)
        setVoiceChatEnabled(false)
      }
      return
    }
    if (!activeAgentId || !workspaceAgents.some(agent => agent.id === activeAgentId)) {
      setActiveAgentId(workspaceAgents[0].id)
    }
  }, [workspaceAgents, activeAgentId, liveVoiceCallEnabled])

  useEffect(() => {
    return () => {
      clearLiveResumeTimer()
      if (agentRecognitionRef.current) {
        try {
          agentRecognitionRef.current.stop()
        } catch {
          // no-op
        }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    
    const init = async () => {
      let initialTtsProvider: 'elevenlabs' | 'csm' = 'elevenlabs'
      // Fetch settings
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) {
          throw new Error('Failed to load settings')
        }
        const data = await res.json()
        if (!data?.settings) {
          throw new Error('Settings payload missing')
        }
        const incomingSettings = data.settings || {}
        const parsedCsmSpeaker = Number(incomingSettings.csmSpeaker)
        initialTtsProvider = incomingSettings.ttsProvider === 'csm' ? 'csm' : 'elevenlabs'
        setSettings(prev => ({
          ...prev,
          ...incomingSettings,
          ttsProvider: initialTtsProvider,
          csmEnabled: Boolean(incomingSettings.csmEnabled),
          csmSpeaker: Number.isFinite(parsedCsmSpeaker) ? Math.max(0, Math.floor(parsedCsmSpeaker)) : 0,
          csmVoiceLabel: String(incomingSettings.csmVoiceLabel || ''),
          includeAutomatedDisclosure: incomingSettings.includeAutomatedDisclosure ?? true,
        }))
        setCredits(typeof data.credits === 'number' ? data.credits : 0)
        setIsConfigured(!!data.isConfigured)
        setManagedMode(!!incomingSettings?.managedMode)
        setAssignedPhoneNumber(incomingSettings?.assignedPhoneNumber || '')
        setIdentityForm(prev => ({
          ...prev,
          industry: incomingSettings?.industry || '',
          mentionAi: incomingSettings?.includeAutomatedDisclosure ?? prev.mentionAi,
          sayThisRules: incomingSettings?.sayThisRules || '',
          avoidThisRules: incomingSettings?.avoidThisRules || '',
        }))
      } catch {
        toast.error('Failed to load settings, using defaults')
      }
      
      // Fetch voices
      try {
        const res = await fetch('/api/voices')
        if (!res.ok) {
          throw new Error('Failed to load voices')
        }
        const data = await res.json()
        setVoices(data.voices || [])
      } catch {
        if (initialTtsProvider === 'csm') {
          setVoices([
            { id: 'csm_speaker_0', name: 'CSM Speaker 0', category: 'csm', labels: { gender: 'any', language: 'multi' }, source: 'csm', language: 'multi' },
            { id: 'csm_speaker_1', name: 'CSM Speaker 1', category: 'csm', labels: { gender: 'any', language: 'multi' }, source: 'csm', language: 'multi' },
          ])
        } else {
          setVoices([
            { id: DEFAULT_FEMALE_VOICE_FALLBACK, name: 'River', category: 'premade', labels: { gender: 'female', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
            { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade', labels: { gender: 'female', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
            { id: DEFAULT_MALE_VOICE_FALLBACK, name: 'Antoni', category: 'premade', labels: { gender: 'male', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
            { id: 'TxGEqnHWrfWFT1GWmBXj', name: 'Josh', category: 'premade', labels: { gender: 'male', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
          ])
        }
      }
      
      await Promise.all([
        fetchCampaigns(),
        fetchRecordings(),
        fetchTeamMembers(),
        fetchBillingProducts(),
        fetchBillingEvents(),
        fetchCallerIdentities(),
        fetchLeadSources(),
        fetchTtsHealth(),
      ])
    }
    
    init()
  }, [fetchCampaigns, fetchRecordings, fetchTeamMembers, fetchBillingProducts, fetchBillingEvents, fetchCallerIdentities, fetchLeadSources, fetchTtsHealth])

  useEffect(() => {
    const hasLiveCampaign = isCalling || currentCampaign?.status === 'scheduled'
    if (!hasLiveCampaign) return

    const interval = setInterval(() => {
      fetchCampaigns()
      if (activeTab === 'recordings' || activeTab === 'overview') {
        fetchRecordings()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [activeTab, currentCampaign?.status, fetchCampaigns, fetchRecordings, isCalling])

  useEffect(() => {
    if (activeTab !== 'recordings') return

    const interval = setInterval(() => {
      fetchRecordings()
    }, 12000)

    return () => clearInterval(interval)
  }, [activeTab, fetchRecordings])

  useEffect(() => {
    if (defaultVoiceAppliedRef.current) return
    if (!voices.length) return
    defaultVoiceAppliedRef.current = true

    const preferredVoiceId =
      settings.ttsProvider === 'csm'
        ? `csm_speaker_${Math.max(0, Math.floor(Number(settings.csmSpeaker || 0)))}`
        : resolveDefaultFemaleVoiceId(voices)

    setSelectedVoice(prev => (!prev || prev === DEFAULT_FEMALE_VOICE_FALLBACK ? preferredVoiceId : prev))
    setIdentityForm(prev => {
      if (!prev.voiceId || prev.voiceId === DEFAULT_FEMALE_VOICE_FALLBACK) {
        return { ...prev, voiceId: preferredVoiceId }
      }
      return prev
    })
  }, [voices, settings.csmSpeaker, settings.ttsProvider])

  useEffect(() => {
    if (settings.ttsProvider === 'csm') {
      const targetSpeaker = Math.max(0, Math.floor(Number(settings.csmSpeaker || 0)))
      const targetVoiceId = `csm_speaker_${targetSpeaker}`
      setSelectedVoice(prev => {
        const currentSpeaker = parseCsmSpeakerFromVoiceId(prev)
        return currentSpeaker === targetSpeaker ? prev : targetVoiceId
      })
      setIdentityForm(prev => {
        const currentSpeaker = parseCsmSpeakerFromVoiceId(prev.voiceId)
        return currentSpeaker === targetSpeaker
          ? prev
          : { ...prev, voiceId: targetVoiceId, gender: 'any' }
      })
      return
    }

    setSelectedVoice(prev => {
      if (parseCsmSpeakerFromVoiceId(prev) === null) return prev
      return resolveDefaultFemaleVoiceId(voices)
    })
    setIdentityForm(prev => {
      if (parseCsmSpeakerFromVoiceId(prev.voiceId) === null) return prev
      return { ...prev, voiceId: resolveDefaultFemaleVoiceId(voices) }
    })
  }, [settings.ttsProvider, settings.csmSpeaker, voices])

  useEffect(() => {
    if (!initRef.current) return
    fetchTtsHealth()
  }, [settings.ttsProvider, settings.csmSpeaker, settings.csmEnabled, fetchTtsHealth])

  // Save settings
  const saveSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      
      if (data.success) {
        setCredits(data.credits)
        setIsConfigured(true)
        setManagedMode(!!settings.managedMode)
        const nextAssigned = data.assignedPhoneNumber || settings.assignedPhoneNumber || assignedPhoneNumber
        setAssignedPhoneNumber(nextAssigned)
        if (nextAssigned && nextAssigned !== settings.telephonyPhoneNumber) {
          setSettings(prev => ({ ...prev, telephonyPhoneNumber: nextAssigned, assignedPhoneNumber: nextAssigned }))
        }
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    }
    setLoading(false)
  }

  const saveTtsProviderSettings = async () => {
    setTtsConfigSaving(true)
    try {
      const payload = {
        ttsProvider: settings.ttsProvider === 'csm' ? 'csm' : 'elevenlabs',
        csmEnabled: Boolean(settings.csmEnabled),
        csmSpeaker: Math.max(0, Math.floor(Number(settings.csmSpeaker || 0))),
        csmVoiceLabel: String(settings.csmVoiceLabel || '').trim(),
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        toast.error(data?.error || 'Failed to save TTS provider settings')
        return
      }

      const voicesRes = await fetch('/api/voices')
      if (!voicesRes.ok) {
        throw new Error('Saved provider but failed to load refreshed voices')
      }
      const voicesData = await voicesRes.json()
      setVoices(Array.isArray(voicesData?.voices) ? voicesData.voices : [])
      await fetchTtsHealth()
      toast.success('TTS provider settings saved')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save TTS provider settings')
    } finally {
      setTtsConfigSaving(false)
    }
  }

  const exportComplianceLogs = async () => {
    setComplianceLoading(true)
    try {
      const res = await fetch('/api/compliance/export')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(String(data?.error || 'Failed to export compliance logs'))
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Callware-compliance-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Compliance logs exported')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to export compliance logs')
    } finally {
      setComplianceLoading(false)
    }
  }

  const deleteLeadAndSuppress = async () => {
    const phoneNumber = complianceLeadNumber.trim()
    if (!phoneNumber) return

    setComplianceLoading(true)
    try {
      const res = await fetch('/api/compliance/delete-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(String(data?.error || 'Failed to delete lead'))
      }
      setComplianceLeadNumber('')
      await fetchCampaigns()
      toast.success('Lead deleted from pursuit and added to DNC')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete lead')
    } finally {
      setComplianceLoading(false)
    }
  }

  const saveLeadSourcesConfig = async () => {
    setSavingLeadSources(true)
    try {
      const res = await fetch('/api/integrations/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zapierEnabled: leadSourceSettings.zapierEnabled,
          googleDriveEnabled: leadSourceSettings.googleDriveEnabled,
          googleDriveCsvUrl: leadSourceSettings.googleDriveCsvUrl.trim(),
          googleDriveAutoSync: leadSourceSettings.googleDriveAutoSync,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        toast.error(data?.error || 'Failed to save lead source settings')
        return
      }

      setLeadSourceSettings(prev => ({
        ...prev,
        zapierEnabled: !!data?.settings?.zapierEnabled,
        zapierInboundSecret: String(data?.settings?.zapierInboundSecret || prev.zapierInboundSecret),
        zapierWebhookUrl: String(data?.webhookUrl || prev.zapierWebhookUrl),
        googleDriveEnabled: !!data?.settings?.googleDriveEnabled,
        googleDriveCsvUrl: String(data?.settings?.googleDriveCsvUrl || ''),
        googleDriveAutoSync: !!data?.settings?.googleDriveAutoSync,
        inboxNewCount: Number(data?.inbox?.newCount || 0),
        inboxConsumedCount: Number(data?.inbox?.consumedCount || 0),
      }))
      setIntegrationEvents(Array.isArray(data?.events) ? data.events : [])
      toast.success('Lead source settings saved')
    } catch {
      toast.error('Failed to save lead source settings')
    } finally {
      setSavingLeadSources(false)
    }
  }

  const rotateZapierWebhookKey = async () => {
    setSavingLeadSources(true)
    try {
      const res = await fetch('/api/integrations/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotateZapierSecret: true }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        toast.error(data?.error || 'Failed to rotate webhook key')
        return
      }

      setLeadSourceSettings(prev => ({
        ...prev,
        zapierInboundSecret: String(data?.settings?.zapierInboundSecret || prev.zapierInboundSecret),
        zapierWebhookUrl: String(data?.webhookUrl || prev.zapierWebhookUrl),
        inboxNewCount: Number(data?.inbox?.newCount || prev.inboxNewCount),
        inboxConsumedCount: Number(data?.inbox?.consumedCount || prev.inboxConsumedCount),
      }))
      setIntegrationEvents(Array.isArray(data?.events) ? data.events : [])
      toast.success('Webhook key rotated. Update your Zapier step now.')
    } catch {
      toast.error('Failed to rotate webhook key')
    } finally {
      setSavingLeadSources(false)
    }
  }

  const syncGoogleDriveLeads = async () => {
    const fileUrl = leadSourceSettings.googleDriveCsvUrl.trim()
    if (!fileUrl) {
      toast.error('Add Google Drive CSV URL first')
      return
    }

    setSyncingGoogleDrive(true)
    try {
      const res = await fetch('/api/integrations/google-drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          persistUrl: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        toast.error(data?.error || 'Google Drive sync failed')
        return
      }

      toast.success(`Google Drive synced: ${data.imported} imported${data.duplicates ? `, ${data.duplicates} duplicates` : ''}`)
      await fetchLeadSources()
    } catch {
      toast.error('Google Drive sync failed')
    } finally {
      setSyncingGoogleDrive(false)
    }
  }

  const pullLeadInboxToComposer = async () => {
    setLoadingLeadInbox(true)
    try {
      const res = await fetch('/api/integrations/inbox/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 300 }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        toast.error(data?.error || 'Failed to pull inbox leads')
        return
      }

      const incomingNumbers = Array.isArray(data?.numbers) ? data.numbers.map((item: unknown) => String(item || '').trim()).filter(Boolean) : []
      if (incomingNumbers.length === 0) {
        toast.error('No new leads in inbox')
        await fetchLeadSources()
        return
      }

      const combinedNumbers = Array.from(new Set([...extractNumbers(numbers), ...incomingNumbers]))
      setNumbers(combinedNumbers.join('\\n'))

      const incomingNotes = Array.isArray(data?.notes) ? data.notes.map((item: unknown) => String(item || '').trim()).filter(Boolean) : []
      if (incomingNotes.length > 0) {
        setLeadNotesText(prev => {
          const prefix = prev.trim()
          return prefix ? `${prefix}\\n${incomingNotes.join('\\n')}` : incomingNotes.join('\\n')
        })
      }

      toast.success(`Loaded ${incomingNumbers.length} leads into Call Center`)
      setActiveTab('call')
      await fetchLeadSources()
    } catch {
      toast.error('Failed to pull inbox leads')
    } finally {
      setLoadingLeadInbox(false)
    }
  }

  const copyWebhookUrl = async () => {
    const url = leadSourceSettings.zapierWebhookUrl
    if (!url) {
      toast.error('Webhook URL is not ready yet')
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Webhook URL copied')
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  const askCopilot = async () => {
    const prompt = copilotInput.trim()
    if (!prompt) return

    const userMessage: CopilotMessage = { role: 'user', content: prompt }
    setCopilotMessages(prev => [...prev, userMessage])
    setCopilotInput('')
    setCopilotLoading(true)

    try {
      const res = await fetch('/api/script-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          messages: copilotMessages,
          context: {
            businessName: settings.businessName || 'Callware',
            industry: settings.industry || selectedCallerIdentity?.industry || '',
            companyDetails: settings.companyDetails || '',
            targetProfile: script,
            objective: selectedCallerIdentity
              ? `Run ${selectedCallerIdentity.position} outreach and qualify lead before transfer`
              : 'Qualify lead and forward to agent',
            audience: 'Potential buyers',
            tone: 'Professional and confident',
            language: selectedCallerIdentity?.language || selectedLanguage,
            callerName: selectedCallerIdentity?.name || '',
            callerPosition: selectedCallerIdentity?.position || '',
            mentionAi: selectedCallerIdentity?.mentionAi || false,
            sayThisRules: selectedCallerIdentity?.sayThisRules || settings.sayThisRules || '',
            avoidThisRules: selectedCallerIdentity?.avoidThisRules || settings.avoidThisRules || '',
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to generate target')
        return
      }

      const generatedTarget = String(data.targetBrief || data.script || '').trim()

      const assistantMessage: CopilotMessage = {
        role: 'assistant',
        content: data.reply || 'I generated a target blueprint for you.',
        script: generatedTarget,
        objections: data.objections || [],
        discoveryQuestions: data.discoveryQuestions || [],
        conversationMoves: data.conversationMoves || [],
      }
      setCopilotMessages(prev => [...prev, assistantMessage])
    } catch {
      toast.error('Target copilot is unavailable')
    } finally {
      setCopilotLoading(false)
    }
  }

  const clearLiveResumeTimer = () => {
    if (liveResumeTimerRef.current) {
      clearTimeout(liveResumeTimerRef.current)
      liveResumeTimerRef.current = null
    }
  }

  const stopAgentVoicePlayback = () => {
    clearLiveResumeTimer()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (agentVoiceAudioRef.current) {
      agentVoiceAudioRef.current.pause()
      agentVoiceAudioRef.current.currentTime = 0
      agentVoiceAudioRef.current.src = ''
    }
    setAgentSpeaking(false)
  }

  const maybeResumeLiveListening = (delayMs = 450) => {
    if (!liveVoiceCallEnabled) return
    if (agentLoading || agentListening || agentSpeaking) return
    if (!activeAgentId) return
    clearLiveResumeTimer()
    liveResumeTimerRef.current = setTimeout(() => {
      liveResumeTimerRef.current = null
      if (!liveVoiceCallEnabled || agentLoading || agentListening || agentSpeaking || !activeAgentId) return
      startAgentListening()
    }, delayMs)
  }

  const handleAgentVoicePlaybackEnded = () => {
    setAgentSpeaking(false)
    maybeResumeLiveListening()
  }

  const speakAgentMessage = async (text: string) => {
    const spoken = text.trim()
    if (!spoken) return

    stopAgentListening()
    stopAgentVoicePlayback()

    const selectedVoiceId = selectedCallerIdentity?.voiceId || selectedVoice
    const selectedVoiceLanguage = selectedCallerIdentity?.language || selectedLanguage || 'en-US'

    if (selectedVoiceId && agentVoiceAudioRef.current) {
      try {
        const url = `/api/calls/tts?script=${encodeURIComponent(spoken)}&voiceId=${encodeURIComponent(selectedVoiceId)}&language=${encodeURIComponent(selectedVoiceLanguage)}`
        setAgentSpeaking(true)
        agentVoiceAudioRef.current.src = url
        await agentVoiceAudioRef.current.play()
        return
      } catch {
        setAgentSpeaking(false)
      }
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Voice playback is not supported in this browser')
      return
    }

    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.lang = selectedVoiceLanguage
    utterance.onstart = () => setAgentSpeaking(true)
    utterance.onend = () => {
      setAgentSpeaking(false)
      maybeResumeLiveListening()
    }
    utterance.onerror = () => {
      setAgentSpeaking(false)
      maybeResumeLiveListening()
    }
    window.speechSynthesis.speak(utterance)
  }

  const getActionLabel = (action?: AgentAction) => {
    if (!action || action === 'none') return ''
    if (action === 'open_billing') return 'Billing'
    if (action === 'open_call') return 'Call Center'
    if (action === 'open_callers') return 'Assistant'
    if (action === 'open_settings') return 'Settings'
    return ''
  }

  const agentActionToTab = (action?: AgentAction) => {
    if (!action || action === 'none') return null
    if (action === 'open_billing') return 'billing'
    if (action === 'open_call') return 'call'
    if (action === 'open_callers') return 'agents'
    if (action === 'open_settings') return 'settings'
    return null
  }

  const getIntelligenceStatusTone = (status: WorkspaceIntelligence['status']) => {
    if (status === 'critical') return 'text-red-300 bg-red-500/15 border-red-500/30'
    if (status === 'needs_attention') return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    if (status === 'ready') return 'text-sky-300 bg-sky-500/15 border-sky-400/30'
    return 'text-blue-300 bg-blue-500/15 border-blue-500/30'
  }

  const getPriorityTone = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return 'text-red-300 bg-red-500/15 border-red-500/30'
    if (priority === 'medium') return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    return 'text-sky-300 bg-sky-500/15 border-sky-400/30'
  }

  const getIntegrationStatusTone = (status: IntegrationActivityEvent['status']) => {
    if (status === 'success') return 'text-sky-300 bg-sky-500/15 border-sky-400/30'
    if (status === 'error') return 'text-red-300 bg-red-500/15 border-red-500/30'
    return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
  }

  const createAgentWelcomeMessage = (profile: AgentProfile, agentDisplayName: string): AgentMessage => ({
    id: `agent-welcome-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'assistant',
    content: `Hi, I’m ${agentDisplayName}. I’ll run your call center setup with you. Tell me your offer, target list type, and expected report format, and I’ll guide each step.`,
    action: 'none',
    checklist: [
      'Define call target and ideal customer profile',
      'Create caller identity with role and language',
      'Upload numbers and launch or schedule campaign',
    ],
  })

  const startAgentSession = (profileId: string) => {
    const profile = agentProfiles.find(agent => agent.id === profileId) || agentProfiles[0]
    if (!profile) return
    const existingAgent = workspaceAgents.find(agent => agent.profileId === profile.id)
    if (existingAgent) {
      setActiveAgentId(existingAgent.id)
      setActiveTab('agents')
      return
    }
    const now = new Date().toISOString()
    const nextAgentId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const safeName = profile.name
    const preset = AGENT_ADMIN_PRESETS[profile.id] || AGENT_ADMIN_PRESETS.sara
    const resolvedPresetVoiceId =
      settings.ttsProvider === 'csm'
        ? `csm_speaker_${Math.max(0, Math.floor(Number(settings.csmSpeaker || 0)))}`
        : resolveDefaultVoiceForPreset(preset, voices)

    const nextAgent: WorkspaceAgent = {
      id: nextAgentId,
      profileId: profile.id,
      name: safeName,
      createdAt: now,
      updatedAt: now,
    }

    setWorkspaceAgents(prev => [nextAgent, ...prev])
    setActiveAgentId(nextAgentId)
    setAgentSessionStarted(true)
    setActiveTab('agents')
    setAgentInput('')
    setSelectedVoice(resolvedPresetVoiceId)
    setSelectedLanguage(preset.language)
    setIdentityForm(prev => ({
      ...prev,
      name: prev.name || safeName,
      position: prev.position || preset.position,
      gender: preset.gender,
      language: preset.language,
      voiceId: resolvedPresetVoiceId,
    }))

    setAgentMessagesByAgent(prev => {
      if (prev[nextAgentId]?.length) return prev
      return {
        ...prev,
        [nextAgentId]: [createAgentWelcomeMessage(profile, safeName)],
      }
    })
  }

  const getBrowserSpeechRecognition = () => {
    if (typeof window === 'undefined') return null
    return ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null) as any
  }

  const stopAgentListening = () => {
    clearLiveResumeTimer()
    const recognition = agentRecognitionRef.current
    if (recognition) {
      try {
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
        recognition.stop()
      } catch {
        // no-op
      }
    }
    agentRecognitionRef.current = null
    setAgentListening(false)
  }

  const summarizeAgentDraft = (draft: AgentFormDraft): string[] => {
    const lines: string[] = []
    if (draft.settings) {
      if (draft.settings.businessName) lines.push(`Business: ${draft.settings.businessName}`)
      if (draft.settings.industry) lines.push(`Industry: ${draft.settings.industry}`)
      if (draft.settings.forwardToNumber) lines.push(`Forwarding number: ${draft.settings.forwardToNumber}`)
      if (draft.settings.sayThisRules) lines.push('Global "say this" rules updated')
      if (draft.settings.avoidThisRules) lines.push('Global "avoid this" rules updated')
    }
    if (draft.callerIdentity) {
      if (draft.callerIdentity.name) lines.push(`Caller name: ${draft.callerIdentity.name}`)
      if (draft.callerIdentity.position) lines.push(`Caller position: ${draft.callerIdentity.position}`)
      if (draft.callerIdentity.language) lines.push(`Caller language: ${draft.callerIdentity.language}`)
      if (draft.callerIdentity.voiceId) lines.push(`Caller voice: ${draft.callerIdentity.voiceId}`)
      if (draft.callerIdentity.campaignGoal) lines.push(`Caller goal: ${draft.callerIdentity.campaignGoal}`)
    }
    if (draft.callCenter) {
      if (draft.callCenter.targetBlueprint) lines.push('Call Center target blueprint updated')
      if (draft.callCenter.numbers) lines.push('Lead numbers draft imported to composer')
      if (draft.callCenter.leadNotes) lines.push('Lead notes draft added to composer')
      if (draft.callCenter.scheduledAt) lines.push(`Campaign schedule: ${draft.callCenter.scheduledAt}`)
    }
    return lines
  }

  const applyAgentDraftToInputs = (draft: AgentFormDraft) => {
    if (draft.settings) {
      setSettings(prev => ({
        ...prev,
        businessName: draft.settings?.businessName || prev.businessName,
        industry: draft.settings?.industry || prev.industry,
        companyDetails: draft.settings?.companyDetails || prev.companyDetails,
        forwardToNumber: draft.settings?.forwardToNumber || prev.forwardToNumber,
        sayThisRules: draft.settings?.sayThisRules || prev.sayThisRules,
        avoidThisRules: draft.settings?.avoidThisRules || prev.avoidThisRules,
      }))
    }

    if (draft.callerIdentity) {
      setShowAdvancedCallerInputs(true)
      setIdentityForm(prev => ({
        ...prev,
        name: draft.callerIdentity?.name || prev.name,
        position: draft.callerIdentity?.position || prev.position,
        gender: draft.callerIdentity?.gender || prev.gender,
        language: draft.callerIdentity?.language || prev.language,
        voiceId: draft.callerIdentity?.voiceId || prev.voiceId,
        industry: draft.callerIdentity?.industry || prev.industry,
        mentionAi: typeof draft.callerIdentity?.mentionAi === 'boolean' ? draft.callerIdentity.mentionAi : prev.mentionAi,
        campaignGoal: draft.callerIdentity?.campaignGoal || prev.campaignGoal,
        script: draft.callerIdentity?.script || prev.script,
        sayThisRules: draft.callerIdentity?.sayThisRules || prev.sayThisRules,
        avoidThisRules: draft.callerIdentity?.avoidThisRules || prev.avoidThisRules,
      }))
      if (draft.callerIdentity.language) {
        setSelectedLanguage(draft.callerIdentity.language)
      }
      if (draft.callerIdentity.voiceId) {
        setSelectedVoice(draft.callerIdentity.voiceId)
      }
    }

    if (draft.callCenter) {
      if (draft.callCenter.targetBlueprint) {
        setScript(draft.callCenter.targetBlueprint)
      }
      if (draft.callCenter.numbers) {
        const normalized = Array.from(new Set(
          draft.callCenter.numbers
            .split(/[\n,;]+/)
            .map(v => v.trim())
            .filter(Boolean)
        )).join('\n')
        if (normalized) {
          setNumbers(normalized)
        }
      }
      if (draft.callCenter.leadNotes) {
        setLeadNotesText(draft.callCenter.leadNotes)
      }
      if (draft.callCenter.scheduledAt) {
        setScheduledAt(draft.callCenter.scheduledAt)
      }
    }

    if (draft.callCenter) {
      setActiveTab('call')
    } else if (draft.callerIdentity) {
      setActiveTab('callers')
    } else if (draft.settings) {
      setActiveTab('settings')
    }
  }

  const approveAndApplyDraft = async (draft?: AgentFormDraft, verificationQuestion?: string) => {
    if (!draft) return
    const summary = summarizeAgentDraft(draft)
    const prompt = verificationQuestion || draft.verificationQuestion || 'Apply these drafted values to your inputs now?'
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(`${prompt}\n\n${summary.length ? summary.map(line => `• ${line}`).join('\n') : 'No detailed values listed.'}`)

    if (!confirmed) return
    applyAgentDraftToInputs(draft)

    if (draft.callerIdentity?.name && draft.callerIdentity?.position) {
      try {
        const activeProfileId = activeAgentProfile?.id || 'sara'
        const preset = AGENT_ADMIN_PRESETS[activeProfileId] || AGENT_ADMIN_PRESETS.sara
        const resolvedPresetVoiceId =
          settings.ttsProvider === 'csm'
            ? `csm_speaker_${Math.max(0, Math.floor(Number(settings.csmSpeaker || 0)))}`
            : resolveDefaultVoiceForPreset(preset, voices)
        const res = await fetch('/api/caller-identities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: draft.callerIdentity.name,
            position: draft.callerIdentity.position || preset.position,
            gender: preset.gender,
            language: preset.language,
            voiceId: resolvedPresetVoiceId,
            industry: draft.callerIdentity.industry || settings.industry || '',
            mentionAi: !!draft.callerIdentity.mentionAi,
            campaignGoal: draft.callerIdentity.campaignGoal || '',
            script: draft.callerIdentity.script || script,
            sayThisRules: draft.callerIdentity.sayThisRules || settings.sayThisRules || '',
            avoidThisRules: draft.callerIdentity.avoidThisRules || settings.avoidThisRules || '',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.success && data?.identity?.id) {
          await fetchCallerIdentities()
          setSelectedCallerIdentityId(data.identity.id)
          setSelectedLanguage(data.identity.language || preset.language)
          setSelectedVoice(data.identity.voiceId || resolvedPresetVoiceId)
          toast.success('Draft applied and caller identity created.')
          return
        }
      } catch {
        // Keep form-applied behavior even if background save fails.
      }
    }

    toast.success('Draft applied to inputs.')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleAgentFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    if (!activeAgentId) {
      toast.error('Create an agent first before uploading files')
      event.target.value = ''
      return
    }

    const uploaded: UploadedChatFile[] = []
    const summaries: string[] = []

    for (const file of files) {
      const isTextLike =
        file.type.startsWith('text/') ||
        /\.(csv|txt|json|md|log)$/i.test(file.name)

      let snippet = ''
      let importedNumbers = 0

      if (isTextLike) {
        try {
          const rawText = await file.text()
          snippet = rawText.replace(/\s+/g, ' ').trim().slice(0, 400)
          const parsedNumbers = extractNumbers(rawText)
          if (parsedNumbers.length > 0) {
            importedNumbers = parsedNumbers.length
            const merged = Array.from(new Set([...extractNumbers(numbers), ...parsedNumbers]))
            setNumbers(merged.join('\n'))
          }
        } catch {
          // Skip parse failure and keep file metadata only.
        }
      }

      uploaded.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        kind: file.type || 'file',
        snippet,
        importedNumbers,
      })

      summaries.push(
        `- ${file.name} (${formatFileSize(file.size)})${importedNumbers > 0 ? `, ${importedNumbers} numbers detected` : ''}${snippet ? `\n  Preview: ${snippet}` : ''}`
      )
    }

    setAgentUploads(prev => [...uploaded, ...prev].slice(0, 12))
    event.target.value = ''

    const uploadPrompt = [
      'I uploaded files for onboarding/campaign setup.',
      'Use these files to draft inputs and ask me for confirmation before applying.',
      '',
      ...summaries,
    ].join('\n')

    await askAgent(uploadPrompt, liveVoiceCallEnabled || voiceChatEnabled)
  }

  const askAgent = async (promptOverride?: string, preferVoiceReply = false) => {
    if (!activeAgentId) {
      toast.error('Create an agent first from Hire an agent or Agents tab')
      setActiveTab('agents')
      return
    }

    const prompt = String(promptOverride ?? agentInput).trim()
    if (!prompt) return

    const messageId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const userMessage: AgentMessage = { id: messageId, role: 'user', content: prompt, action: 'none' }
    const currentMessages = agentMessagesByAgent[activeAgentId] || []
    const nextMessages = [...currentMessages, userMessage]
    setAgentMessagesByAgent(prev => ({ ...prev, [activeAgentId]: nextMessages }))
    setWorkspaceAgents(prev => prev.map(agent => (
      agent.id === activeAgentId ? { ...agent, updatedAt: new Date().toISOString() } : agent
    )))
    setAgentInput('')
    setAgentLoading(true)
    let repliedInVoice = false

    try {
      const selectedIdentity = callerIdentities.find(item => item.id === selectedCallerIdentityId)
      const selectedWorkspaceAgent = workspaceAgents.find(agent => agent.id === activeAgentId)
      const selectedProfile = agentProfiles.find(agent => agent.id === selectedWorkspaceAgent?.profileId) || agentProfiles[0]
      const selectedAgentName = selectedWorkspaceAgent?.name || selectedProfile?.name || 'Sara'
      const res = await fetch('/api/agent-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          messages: nextMessages.map(msg => ({ role: msg.role, content: msg.content })),
          context: {
            selectedAgentName,
            credits,
            numbersCount: extractNumbers(numbers).length,
            callerIdentityName: selectedIdentity?.name || '',
            callerIdentitiesCount: callerIdentities.length,
            activeCallerNumbers: callerNumbersActive,
            campaignCount: campaigns.length,
            currentCampaignName: currentCampaign?.name || '',
            currentCampaignStatus: currentCampaign?.status || '',
            isCalling,
            totalCalls,
            connectedCalls,
            scheduledCallbacks: callbacksScheduled,
            dueCallbacks: callbacksDueNow,
            businessName: settings.businessName || '',
            industry: settings.industry || '',
            companyDetails: settings.companyDetails || '',
            forwardToNumber: settings.forwardToNumber || '',
            sayThisRules: settings.sayThisRules || '',
            avoidThisRules: settings.avoidThisRules || '',
            managedMode,
            currentTab: activeTab,
            targetBlueprint: script,
            currentCallerDraft: identityForm,
            currentLeadNotes: leadNotesText,
            currentSchedule: scheduledAt,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || 'Agent is unavailable')
        return
      }

      const assistantMessage: AgentMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: 'assistant',
        content: String(data.reply || 'I reviewed your setup and prepared the next step.'),
        action: (data.action || 'none') as AgentMessage['action'],
        checklist: Array.isArray(data.checklist) ? data.checklist : [],
        actionReason: String(data.actionReason || ''),
        confidence: Number(data.confidence || 0),
        conversationMode: String(data.conversationMode || ''),
        formDraft: data.formDraft && typeof data.formDraft === 'object' ? data.formDraft as AgentFormDraft : undefined,
        verificationQuestion: String(data.verificationQuestion || data.formDraft?.verificationQuestion || ''),
      }
      setAgentMessagesByAgent(prev => ({
        ...prev,
        [activeAgentId]: [...(prev[activeAgentId] || []), assistantMessage],
      }))
      setWorkspaceAgents(prev => prev.map(agent => (
        agent.id === activeAgentId ? { ...agent, updatedAt: new Date().toISOString() } : agent
      )))

      if (voiceChatEnabled || preferVoiceReply || liveVoiceCallEnabled) {
        repliedInVoice = true
        void speakAgentMessage(assistantMessage.content)
      }

      const suggestedTab = agentActionToTab(assistantMessage.action)
      if (suggestedTab && (assistantMessage.confidence || 0) >= 90) {
        setActiveTab(suggestedTab)
        toast.success(`Opened ${getActionLabel(assistantMessage.action)} based on ${activeAgentName}'s recommendation`)
      }
    } catch {
      toast.error('Agent is unavailable')
    } finally {
      setAgentLoading(false)
      if (liveVoiceCallEnabled && !repliedInVoice) {
        maybeResumeLiveListening()
      }
    }
  }

  const sendOnboardingPrompt = async (prompt: string) => {
    const nextPrompt = String(prompt || '').trim()
    if (!nextPrompt) return
    setAgentInput(nextPrompt)
    await askAgent(nextPrompt, liveVoiceCallEnabled || voiceChatEnabled)
  }

  const applyLeadListSelection = (name: string) => {
    const nextName = String(name || '').trim()
    if (!nextName) return

    let nextContext = { offer: '', goal: '', notes: '' }
    setLeadListContexts(prev => {
      const withCurrent = {
        ...prev,
        [selectedLeadList]: contentInput,
      }
      nextContext = withCurrent[nextName] || { offer: '', goal: '', notes: '' }
      return withCurrent
    })
    setSelectedLeadList(nextName)
    setContentInput(nextContext)
  }

  const addLeadList = () => {
    const name = newLeadListName.trim()
    if (!name) {
      toast.error('Add a list name first')
      return
    }
    applyLeadListSelection(name)
    setNewLeadListName('')
    toast.success(`Lead list "${name}" is ready`)
  }

  const submitContentInputToAgent = async () => {
    const offer = contentInput.offer.trim()
    const goal = contentInput.goal.trim()
    const notes = contentInput.notes.trim()

    if (!offer && !goal && !notes) {
      toast.error('Add at least one content input field')
      return
    }

    const prompt = [
      'Use this structured content input to create/update my setup and ask for approval before applying:',
      `Lead List: ${selectedLeadList}`,
      offer ? `Offer: ${offer}` : '',
      goal ? `Goal: ${goal}` : '',
      notes ? `Notes/constraints: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    await askAgent(prompt, liveVoiceCallEnabled || voiceChatEnabled)
  }

  const startAgentListening = () => {
    if (!activeAgentId) {
      toast.error('Create an agent first from Hire an agent or Agents tab')
      setActiveTab('agents')
      return
    }
    if (agentLoading || agentSpeaking) return

    const Recognition = getBrowserSpeechRecognition()
    if (!Recognition) {
      toast.error('Voice input is not supported in this browser')
      return
    }

    stopAgentListening()
    const recognition = new Recognition()
    agentRecognitionRef.current = recognition
    recognition.lang = selectedCallerIdentity?.language || selectedLanguage || 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event: any) => {
      const transcript = String(event?.results?.[0]?.[0]?.transcript || '').trim()
      stopAgentListening()
      if (!transcript) {
        toast.error('No speech detected, try again')
        return
      }
      setAgentInput(transcript)
      void askAgent(transcript, true)
    }
    recognition.onerror = (event: any) => {
      stopAgentListening()
      const errorCode = String(event?.error || '')
      if (errorCode !== 'no-speech' && errorCode !== 'aborted') {
        toast.error('Voice input failed')
      }
      if (liveVoiceCallEnabled && errorCode !== 'aborted') {
        maybeResumeLiveListening(800)
      }
    }
    recognition.onend = () => {
      setAgentListening(false)
      agentRecognitionRef.current = null
      if (liveVoiceCallEnabled && !agentLoading && !agentSpeaking) {
        maybeResumeLiveListening(550)
      }
    }

    try {
      setAgentListening(true)
      recognition.start()
    } catch {
      stopAgentListening()
      toast.error('Could not start microphone capture')
    }
  }

  const toggleLiveVoiceCall = () => {
    if (!activeAgentId) {
      toast.error('Create an agent first from Hire an agent or Agents tab')
      setActiveTab('agents')
      return
    }

    const next = !liveVoiceCallEnabled
    setLiveVoiceCallEnabled(next)
    if (next) {
      setVoiceChatEnabled(true)
      stopAgentVoicePlayback()
      stopAgentListening()
      maybeResumeLiveListening(200)
      toast.success('Live voice call started')
      return
    }

    stopAgentListening()
    stopAgentVoicePlayback()
    toast.success('Live voice call ended')
  }

  // Start calling
  const startCalling = async () => {
    if (!isConfigured) {
      toast.error('Please configure your settings first')
      setActiveTab('settings')
      return
    }
    
    const numberList = extractNumbers(numbers)
    
    if (numberList.length === 0) {
      toast.error('Please enter at least one phone number')
      return
    }

    if (!selectedCallerIdentityId) {
      toast.error('Please assign this campaign to a caller identity')
      setActiveTab('callers')
      return
    }

    const identity = callerIdentities.find(item => item.id === selectedCallerIdentityId)
    if (managedMode && !identity?.dedicatedNumber) {
      toast.error('This caller has no dedicated number yet. Buy number for this caller first.')
      setActiveTab('callers')
      return
    }

    if (scheduledAt) {
      const parsed = new Date(scheduledAt)
      if (Number.isNaN(parsed.getTime())) {
        toast.error('Invalid schedule date')
        return
      }
    }
    
    if (credits < numberList.length) {
      toast.error(`Not enough credits. Need ${numberList.length}, have ${credits}`)
      setActiveTab('billing')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers: numberList,
          voiceId: selectedVoice,
          language: selectedLanguage,
          callerIdentityId: selectedCallerIdentityId || undefined,
          scheduledAt: scheduledAt || undefined,
          target: script,
          script,
          leadNotes: leadNotesText,
          record: settings.recordCalls,
          transcribe: settings.transcribeCalls,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setCurrentCampaign(data.campaign)
        setIsCalling(data.campaign?.status === 'running')
        fetchCampaigns()
        toast.success(data.message)
      } else {
        if (data.code === 'CALLER_NUMBER_REQUIRED') {
          setActiveTab('callers')
        } else if (String(data.error || '').toLowerCase().includes('not enough credits')) {
          setActiveTab('billing')
        }
        toast.error(data.error || 'Failed to start calling')
      }
    } catch {
      toast.error('Failed to start calling')
    }
    setLoading(false)
  }

  const startTestCallToMyNumber = async () => {
    const targetNumber = String(settings.forwardToNumber || '').trim()
    if (!targetNumber) {
      toast.error('Add your forwarding number in Settings first')
      setActiveTab('settings')
      return
    }

    setTestingCall(true)
    try {
      const res = await fetch('/api/demo-call/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: targetNumber,
          name: settings.businessName || 'Workspace',
          consent: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(String(data?.error || 'Unable to start test call right now.'))
      }
      toast.success(String(data?.message || 'Test call started. Keep your phone nearby.'))
    } catch (error: any) {
      toast.error(error?.message || 'Unable to start test call right now.')
    } finally {
      setTestingCall(false)
    }
  }

  // Stop calling
  const stopCalling = async () => {
    if (!currentCampaign) return
    
    try {
      await fetch(`/api/calls?id=${currentCampaign.id}`, { method: 'DELETE' })
      setIsCalling(false)
      setCurrentCampaign(null)
      fetchCampaigns()
      toast.success('Campaign stopped')
    } catch {
      toast.error('Failed to stop campaign')
    }
  }

  const extractNumbers = (input: string) => {
    return Array.from(new Set(
      input
        .split(/[\n,;]+/)
        .map(n => n.trim())
        .filter(Boolean)
    ))
  }

  const toDateTimeInputValue = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 16)
  }

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const rawCells = text
        .split(/\r?\n/)
        .flatMap(row => row.split(','))
        .map(cell => cell.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)

      const parsedNumbers = Array.from(new Set(
        rawCells
          .map(cell => cell.replace(/[^\d+]/g, ''))
          .filter(cell => {
            const numeric = cell.replace(/\D/g, '')
            return numeric.length >= 8
          })
      ))

      if (parsedNumbers.length === 0) {
        toast.error('No valid phone numbers found in the file')
        return
      }

      const combined = Array.from(new Set([...extractNumbers(numbers), ...parsedNumbers]))
      setNumbers(combined.join('\n'))
      toast.success(`Imported ${parsedNumbers.length} numbers`)
    } catch {
      toast.error('Failed to import CSV')
    } finally {
      if (csvInputRef.current) {
        csvInputRef.current.value = ''
      }
    }
  }

  const loadCampaignToComposer = (campaign: Campaign) => {
    setNumbers((campaign.numbers || []).join('\n'))
    if (campaign.script) {
      setScript(campaign.script)
    }
    if (campaign.voiceId) {
      setSelectedVoice(campaign.voiceId)
    }
    if (campaign.language) {
      setSelectedLanguage(campaign.language)
    }
    if (campaign.callerIdentityId) {
      setSelectedCallerIdentityId(campaign.callerIdentityId)
    }
    const noteLines = (campaign.results || [])
      .filter(result => result.userComment || result.targetComment)
      .map(result => `${result.phoneNumber} | ${result.userComment || ''} | ${result.targetComment || ''}`)
    setLeadNotesText(noteLines.join('\n'))
    setScheduledAt(toDateTimeInputValue(campaign.scheduledAt))
    setActiveTab('call')
    toast.success('Campaign loaded into Call Center')
  }

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'N/A'
    return date.toLocaleString()
  }

  const loadScheduledCallbacksToComposer = () => {
    const pendingCallbacks = callbackQueue.filter(item => item.status === 'scheduled')
    if (pendingCallbacks.length === 0) {
      toast.error('No scheduled callbacks found')
      return
    }

    const uniqueNumbers = Array.from(new Set(pendingCallbacks.map(item => item.phoneNumber)))
    setNumbers(uniqueNumbers.join('\n'))

    const lines = pendingCallbacks.map(item => {
      const details = [item.reason, item.targetComment, item.userComment].filter(Boolean).join(' | ')
      return `${item.phoneNumber} | callback at ${formatDateTime(item.callbackAt)} | ${details}`.trim()
    })
    setLeadNotesText(lines.join('\n'))
    setActiveTab('call')
    toast.success(`Loaded ${uniqueNumbers.length} callback numbers into Call Center`)
  }

  // Transcribe recording
  const transcribeRecording = async (recordingId: string) => {
    setTranscribing(recordingId)
    try {
      const res = await fetch('/api/transcriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId, useOpenAI: true }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Transcription completed!')
        fetchRecordings()
      } else {
        toast.error(data.error || 'Failed to transcribe')
      }
    } catch {
      toast.error('Failed to transcribe recording')
    }
    setTranscribing(null)
  }

  // Play recording
  const playRecording = (url: string, id: string) => {
    if (playingRecording === id && audioRef.current) {
      audioRef.current.pause()
      setPlayingRecording(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
        setPlayingRecording(id)
      }
    }
  }

  // Get stats
  const getStats = () => {
    if (!currentCampaign) return { total: 0, connected: 0, failed: 0, pending: 0, noAnswer: 0, voicemail: 0 }
    
    const results = currentCampaign.results || []
    return {
      total: currentCampaign.numbers?.length || 0,
      connected: results.filter(r => r.status === 'connected').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: results.filter(r => r.status === 'pending').length,
      noAnswer: results.filter(r => r.status === 'no-answer').length,
      voicemail: results.filter(r => r.status === 'voicemail').length,
    }
  }

  const stats = getStats()
  
  // Get sentiment color
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-sky-300 bg-sky-500/20'
      case 'negative': return 'text-red-400 bg-red-500/20'
      default: return 'text-zinc-400 bg-zinc-500/20'
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'recordings') {
      fetchRecordings()
    }
    if (tab === 'sources') {
      fetchLeadSources()
    }
    if (tab === 'billing') {
      fetchBillingEvents()
    }
    if (tab === 'history' || tab === 'overview' || tab === 'leads' || tab === 'callbacks') {
      fetchCampaigns()
    }
  }

  const totalCalls = campaigns.reduce((sum, c) => sum + (c.results?.length || 0), 0)
  const totalNumbersQueued = campaigns.reduce((sum, c) => sum + (c.numbers?.length || 0), 0)
  const leadProfiles = useMemo(() => buildLeadProfiles(campaigns), [campaigns])
  const callbackQueue = useMemo(() => buildCallbackQueue(campaigns), [campaigns])
  const dailyReport = useMemo(() => buildDailyReport(campaigns, new Date()), [campaigns])
  const leadSearchQuery = leadSearch.trim().toLowerCase()
  const filteredLeads = leadProfiles.filter(profile => {
    if (!leadSearchQuery) return true
    return (
      profile.phoneNumber.toLowerCase().includes(leadSearchQuery) ||
      String(profile.latestUserComment || '').toLowerCase().includes(leadSearchQuery) ||
      String(profile.latestTargetComment || '').toLowerCase().includes(leadSearchQuery) ||
      String(profile.latestLeadSummary || '').toLowerCase().includes(leadSearchQuery)
    )
  })
  const filteredCallbacks = callbackQueue.filter(item => {
    if (callbackFilter === 'all') return true
    return item.status === callbackFilter
  })
  const callbacksDueNow = callbackQueue.filter(item =>
    item.status === 'scheduled' && new Date(item.callbackAt).getTime() <= Date.now()
  ).length
  const callbacksScheduled = callbackQueue.filter(item => item.status === 'scheduled').length
  const transcribedCount = recordings.filter(r => r.transcript).length
  const callerNumbersActive = callerIdentities.filter(identity => !!identity.dedicatedNumber).length
  const workspaceIntelligence = useMemo(
    () =>
      buildWorkspaceIntelligence({
        campaigns,
        credits,
        preparedNumbers: extractNumbers(numbers).length,
        callerIdentities: callerIdentities.length,
        callerNumbersActive,
        managedMode,
        hasForwardingNumber: !!settings.forwardToNumber?.trim(),
        hasTargetBlueprint: script.trim().length >= 20,
        scheduledCallbacks: callbacksScheduled,
        callbacksDueNow,
        hasAgentSession: agentSessionStarted,
      }),
    [
      campaigns,
      credits,
      numbers,
      callerIdentities.length,
      callerNumbersActive,
      managedMode,
      settings.forwardToNumber,
      script,
      callbacksScheduled,
      callbacksDueNow,
      agentSessionStarted,
    ]
  )
  const creditProducts = Object.values(billingProducts)
    .filter(product => product.kind === 'credits')
    .sort((a, b) => (a.credits || 0) - (b.credits || 0))
  const estimatedCostPer100 = useMemo(() => {
    const scored = creditProducts
      .filter(product => Number(product.credits || 0) > 0 && Number(product.price || 0) > 0)
      .map(product => (Number(product.price) / Number(product.credits)) * 100)
      .sort((a, b) => a - b)
    if (scored.length === 0) return null
    return Number(scored[0].toFixed(2))
  }, [creditProducts])
  const lowCreditThreshold = 30
  const numberActivationPrice =
    billingProducts.number_activation?.price || DEFAULT_BILLING_PRODUCTS.number_activation.price
  const successRate = totalCalls > 0
    ? Math.round((campaigns.reduce((sum, c) => sum + (c.results?.filter(r => r.status === 'connected').length || 0), 0) / totalCalls) * 100)
    : 0
  const connectedCalls = campaigns.reduce((sum, c) => sum + (c.results?.filter(r => r.status === 'connected').length || 0), 0)
  const topStats = [
    totalCalls > 0
      ? {
          label: 'Total Calls',
          value: totalCalls,
          description: 'Across all historical campaigns',
          icon: Phone,
        }
      : null,
    totalCalls > 0
      ? {
          label: 'Success Rate',
          value: `${successRate}%`,
          description: 'Calls that resulted in engagement',
          trend: successRate > 50 ? 'Healthy' : 'Needs Review',
          trendColor: successRate > 50 ? 'text-sky-300' : 'text-amber-400',
          icon: TrendingUp,
        }
      : null,
    transcribedCount > 0
      ? {
          label: 'Transcribed',
          value: transcribedCount,
          description: 'Calls with full transcript analysis',
          icon: Mic,
        }
      : null,
    callbacksDueNow > 0
      ? {
          label: 'Callbacks Due',
          value: callbacksDueNow,
          description: 'Scheduled callbacks overdue now',
          trend: 'Action needed',
          trendColor: 'text-amber-400',
          icon: CalendarClock,
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string
    value: string | number
    description: string
    icon: any
    trend?: string
    trendColor?: string
  }>
  const preparedNumbers = extractNumbers(numbers).length
  const readinessItems = [
    { label: 'Forwarding number configured', ready: !!settings.forwardToNumber?.trim(), tab: 'settings' },
    { label: 'Credits available', ready: credits > 0, tab: 'billing' },
    { label: 'Target blueprint prepared', ready: script.trim().length >= 20, tab: 'call' },
    { label: 'Lead list imported', ready: preparedNumbers > 0, tab: 'call' },
    {
      label: managedMode ? 'At least one caller has a dedicated number' : 'Calling setup active',
      ready: managedMode ? callerNumbersActive > 0 : isConfigured,
      tab: managedMode ? 'callers' : 'settings',
    },
  ]
  const readinessScore = Math.round((readinessItems.filter(item => item.ready).length / readinessItems.length) * 100)
  const startSteps = [
    {
      label: 'Create agent',
      done: callerIdentities.length > 0,
      tab: 'callers',
    },
    {
      label: 'Plan with Maya',
      done: agentSessionStarted && Object.values(agentMessagesByAgent).some(messages => messages.length > 1),
      tab: 'agents',
    },
    {
      label: managedMode ? 'Buy credits + line' : 'Buy credits',
      done: managedMode ? (credits > 0 && callerNumbersActive > 0) : credits > 0,
      tab: 'billing',
    },
    {
      label: 'Upload CSV leads',
      done: preparedNumbers > 0,
      tab: 'call',
    },
    {
      label: 'Start campaign',
      done: campaigns.length > 0,
      tab: 'call',
    },
  ]
  const nextStep = startSteps.find(step => !step.done)
  const activeWorkspaceAgent = workspaceAgents.find(agent => agent.id === activeAgentId) || null
  const activeAgentProfile =
    agentProfiles.find(agent => agent.id === activeWorkspaceAgent?.profileId) ||
    agentProfiles[0]
  const activeAgentName = activeWorkspaceAgent?.name || activeAgentProfile?.name || 'Sara'
  const agentMessages = activeAgentId ? (agentMessagesByAgent[activeAgentId] || []) : []
  const showSideAssistant = agentSessionStarted && activeTab !== 'agents'
  const navItems = [
    { tab: 'agents', icon: Bot, label: 'Assistant', badge: null as string | null },
    { tab: 'call', icon: Phone, label: 'Call Center', badge: null as string | null },
    { tab: 'leads', icon: ClipboardList, label: 'Leads', badge: null as string | null },
    { tab: 'callbacks', icon: CalendarClock, label: 'Callbacks', badge: callbacksDueNow > 0 ? String(callbacksDueNow) : null },
    { tab: 'history', icon: History, label: 'History', badge: null as string | null },
    { tab: 'billing', icon: Wallet, label: 'Billing', badge: null as string | null },
    { tab: 'settings', icon: Settings, label: 'Settings', badge: null as string | null },
  ]
  const mobilePrimaryTabs = navItems.filter(item =>
    ['agents', 'call', 'leads', 'billing', 'settings'].includes(item.tab)
  )
  const leadLists = useMemo(() => {
    const names = Object.keys(leadListContexts)
    if (!names.includes(selectedLeadList)) {
      names.unshift(selectedLeadList)
    }
    return Array.from(new Set(names.filter(Boolean)))
  }, [leadListContexts, selectedLeadList])

  useEffect(() => {
    setLeadListContexts(prev => {
      const existing = prev[selectedLeadList]
      if (
        existing &&
        existing.offer === contentInput.offer &&
        existing.goal === contentInput.goal &&
        existing.notes === contentInput.notes
      ) {
        return prev
      }
      return {
        ...prev,
        [selectedLeadList]: contentInput,
      }
    })
  }, [contentInput, selectedLeadList])

  const filteredRecordings = recordings.filter(recording => {
    const query = recordingSearch.trim().toLowerCase()
    if (!query) return true

    return (
      recording.phoneNumber.toLowerCase().includes(query) ||
      recording.status.toLowerCase().includes(query) ||
      (recording.transcript?.summary || '').toLowerCase().includes(query) ||
      (recording.transcript?.text || '').toLowerCase().includes(query) ||
      (recording.transcript?.keywords || []).some(keyword => keyword.toLowerCase().includes(query))
    )
  })

  useEffect(() => {
    if (filteredRecordings.length === 0) {
      setSelectedRecording(null)
      return
    }

    setSelectedRecording(prev =>
      prev && filteredRecordings.some(recording => recording.id === prev.id)
        ? prev
        : filteredRecordings[0]
    )
  }, [filteredRecordings])

  const activeTabTitle =
    activeTab === 'overview'
      ? 'Overview'
      : activeTab === 'agents'
        ? 'Assistant'
      : activeTab === 'call'
        ? 'Call Center'
      : activeTab === 'sources'
        ? 'Lead Sources'
      : activeTab === 'callers'
        ? 'Agents'
      : activeTab === 'recordings'
        ? 'Recordings'
      : activeTab === 'leads'
        ? 'Leads'
      : activeTab === 'callbacks'
        ? 'Callback Queue'
      : activeTab === 'history'
        ? 'History'
      : activeTab === 'billing'
        ? 'Billing'
      : 'Settings'

  const activeTabHint =
    activeTab === 'overview'
      ? 'Use this page to follow the next step.'
      : activeTab === 'agents'
        ? 'Plan with Maya and move directly into campaign execution.'
      : activeTab === 'call'
        ? 'Upload numbers and start or schedule campaigns.'
      : activeTab === 'sources'
        ? 'Connect Zapier/Facebook and Google Drive to feed your lead inbox.'
      : activeTab === 'callers'
        ? 'Hire and manage outbound agents and outreach behaviors.'
      : activeTab === 'recordings'
        ? 'Review recordings and transcripts.'
      : activeTab === 'leads'
        ? 'Track per-lead timeline, comments, and engagement quality.'
      : activeTab === 'callbacks'
        ? 'Manage scheduled callback tasks and move them back into the call center.'
      : activeTab === 'history'
        ? 'Reuse previous campaign setups.'
      : activeTab === 'billing'
        ? 'Buy credits and dedicated caller numbers.'
      : 'Update account and forwarding settings.'

  return (
    <div className="cw-editor-shell mobile-flat-cards min-h-screen flex bg-zinc-950 text-white">
      {/* Hidden audio elements */}
      <audio ref={audioRef} onEnded={() => setPlayingRecording(null)} />
      <audio ref={voicePreviewAudioRef} onEnded={() => setPreviewingVoice(null)} />
      <audio ref={agentVoiceAudioRef} onEnded={handleAgentVoicePlaybackEnded} onPause={handleAgentVoicePlaybackEnded} />

      {/* Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 border-r border-sky-300/15 bg-zinc-950/75 backdrop-blur-xl flex-col z-30 overflow-hidden shadow-[0_0_30px_rgba(56,189,248,0.08)]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800/60 shrink-0">
          <BrandLogo showTagline />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => handleTabChange(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === item.tab
                  ? 'bg-sky-500/15 text-sky-300'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.tab ? 'text-sky-300' : 'text-zinc-500'}`} />
              <span className="truncate">{item.label}</span>
              {item.badge ? (
                <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Bottom bar */}
        <div className="px-3 pb-4 pt-3 border-t border-zinc-800/60 space-y-2 shrink-0">
          {managedMode && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/40 border border-zinc-700/40">
              <span className="text-[11px] text-zinc-500">Numbers</span>
              <span className="text-xs font-semibold text-sky-300">{callerNumbersActive}/{callerIdentities.length}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/40 border border-zinc-700/40">
            <span className="text-[11px] text-zinc-500">Credits</span>
            <span className="text-sm font-bold text-sky-300">{credits}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main wrapper (offset by sidebar width) */}
      <div className="pl-0 md:pl-60 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-sky-300/15 bg-zinc-950/70 backdrop-blur-xl shrink-0">
          <div className="px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-3 md:gap-4">
            <div className="min-w-0 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="md:hidden h-8 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                  >
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-700 min-w-[220px]">
                  {navItems.map(item => (
                    <DropdownMenuItem
                      key={`mobile-nav-${item.tab}`}
                      className="text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
                      onClick={() => handleTabChange(item.tab)}
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-zinc-400" />
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                          {item.badge}
                        </span>
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] text-zinc-500 uppercase tracking-widest font-medium">Workspace</p>
                <h1 className="text-lg md:text-xl font-semibold tracking-tight truncate">{activeTabTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end shrink-0">
              {managedMode && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] md:text-xs">Managed</Badge>
              )}
              {isConfigured ? (
                <Badge className="bg-sky-500/20 text-sky-300 border-sky-400/30 text-[10px] md:text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] md:text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Setup
                </Badge>
              )}
              {isCalling && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse" />
                  <span className="text-xs font-medium text-sky-300">Running</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 md:px-10 py-5 md:py-8 pb-24 md:pb-8 space-y-6 md:space-y-8">
        <section className="md:hidden">
          <p className="text-xs text-zinc-400">{activeTabHint}</p>
        </section>
        {topStats.length > 0 && (
          <section className="hidden md:grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {topStats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                description={stat.description}
                trend={stat.trend}
                trendColor={stat.trendColor}
                icon={stat.icon}
              />
            ))}
          </section>
        )}

        <div className={`grid gap-6 md:gap-10 ${showSideAssistant ? 'xl:grid-cols-[420px_minmax(0,1fr)]' : ''}`}>
          {showSideAssistant && (
            <aside className="hidden xl:block xl:sticky xl:top-24 xl:h-[calc(100vh-7rem)]">
              <Card className="h-full bg-zinc-900/90 border-zinc-800 shadow-lg shadow-black/30">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="w-4 h-4 text-sky-300" />
                      Agent Chat
                    </CardTitle>
                    <Badge className="bg-sky-500/20 text-sky-300 border-sky-400/30 max-w-[180px] truncate">
                      {activeAgentName}
                    </Badge>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="bg-zinc-800 hover:bg-zinc-700 h-8"
                      onClick={() => setActiveTab('agents')}
                    >
                      Open Agents
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-7rem)] flex flex-col gap-3">
                  <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-3">
                    {!activeAgentId ? (
                      <p className="text-sm text-zinc-500">
                        Create an agent in the Agents tab to start a dedicated conversation history.
                      </p>
                    ) : agentMessages.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Ask {activeAgentName} to plan campaigns, set caller identities, assign numbers, and review lead outcomes.
                      </p>
                    ) : (
                      agentMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-zinc-800/80' : 'bg-zinc-900 border border-zinc-700'}`}
                        >
                          <p className="text-xs uppercase tracking-wide text-zinc-400 mb-1">{msg.role === 'user' ? 'You' : activeAgentName}</p>
                          <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
                          {msg.formDraft && (
                            <div className="mt-3 rounded-md border border-sky-400/20 bg-sky-500/10 p-2 space-y-2">
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 px-3 text-xs bg-sky-500 hover:bg-sky-400"
                                onClick={() => approveAndApplyDraft(msg.formDraft, msg.verificationQuestion)}
                              >
                                Approve & Apply
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className={agentListening ? 'bg-sky-500 hover:bg-sky-400' : 'bg-zinc-800 hover:bg-zinc-700'}
                        onClick={agentListening ? stopAgentListening : startAgentListening}
                        disabled={!activeAgentId || agentLoading || liveVoiceCallEnabled}
                      >
                        {agentListening ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                        {agentListening ? 'Listening…' : 'Talk'}
                      </Button>
                      <Button
                        type="button"
                        variant={liveVoiceCallEnabled ? 'default' : 'secondary'}
                        className={liveVoiceCallEnabled ? 'bg-sky-500 hover:bg-sky-400' : 'bg-zinc-800 hover:bg-zinc-700'}
                        onClick={toggleLiveVoiceCall}
                        disabled={!activeAgentId || agentLoading}
                      >
                        {liveVoiceCallEnabled ? <Square className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                        {liveVoiceCallEnabled ? 'End Voice Call' : 'Start Voice Call'}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                      value={agentInput}
                      onChange={(e) => setAgentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !agentLoading) {
                          e.preventDefault()
                          void askAgent()
                        }
                      }}
                      placeholder={`Message ${activeAgentName}...`}
                      className="bg-zinc-800 border-zinc-700 h-10"
                      disabled={!activeAgentId}
                    />
                    <Button onClick={() => void askAgent()} disabled={agentLoading || !agentInput.trim() || !activeAgentId}>
                      {agentLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                    <p className="text-[11px] text-zinc-500">
                      {agentSpeaking ? 'Replying…' : agentListening ? 'Listening…' : liveVoiceCallEnabled ? 'Live voice call active' : 'Type or press Talk'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}

          <div className="space-y-6 min-w-0">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                {activeTab === 'overview' && nextStep && (
                  <div className="hidden md:flex rounded-xl border border-sky-400/20 bg-sky-500/5 px-4 py-3 flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <p className="text-sm text-zinc-400">{activeTabHint}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab(nextStep.tab)}
                      className="text-xs text-sky-300 hover:text-sky-200 underline underline-offset-2 shrink-0"
                    >
                      Next: {nextStep.label}
                    </button>
                  </div>
                )}

          <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-200">
            <OverviewTab 
              startSteps={startSteps}
              setActiveTab={setActiveTab}
              readinessScore={readinessScore}
              readinessItems={readinessItems}
              connectedCalls={connectedCalls}
              totalCalls={totalCalls}
              totalNumbersQueued={totalNumbersQueued}
              successRate={successRate}
              currentCampaign={currentCampaign}
              stats={stats}
              credits={credits}
              managedMode={managedMode || false}
              callerNumbersActive={callerNumbersActive}
              callerIdentities={callerIdentities}
              callbacksScheduled={callbacksScheduled}
              callbacksDueNow={callbacksDueNow}
              dailyReport={dailyReport}
              workspaceIntelligence={workspaceIntelligence}
              getIntelligenceStatusTone={getIntelligenceStatusTone}
              getPriorityTone={getPriorityTone}
              onStartTestCall={startTestCallToMyNumber}
              testCallLoading={testingCall}
              hasForwardingNumber={!!settings.forwardToNumber?.trim()}
            />
          </TabsContent>

          <TabsContent value="agents" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
              <CardHeader className="pb-3 md:pb-4">
                <div>
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Bot className="w-5 h-5 md:w-6 md:h-6 text-sky-300" />
                    Start with your calling agent
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    Pick an agent from the list below to start.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!activeAgentId ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {agentProfiles.map(profile => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => startAgentSession(profile.id)}
                        className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-left hover:border-zinc-600 transition"
                      >
                        <p className="text-base font-semibold text-zinc-100">{profile.name}</p>
                        <p className="text-xs text-zinc-400 mt-1">{profile.language} • {profile.style}</p>
                        <p className="text-sm text-zinc-300 mt-2">{profile.expertise}</p>
                        <p className="text-xs text-zinc-500 mt-2">{profile.intro}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 h-[52vh] md:h-[58vh] overflow-y-auto p-3 md:p-4 space-y-3">
                      {agentMessages.length === 0 ? (
                        <div className="text-sm text-zinc-500">
                          Start by describing your business and goal. I will create and verify all setup inputs with you.
                        </div>
                      ) : (
                        agentMessages.map(msg => (
                          <div
                            key={msg.id}
                            className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-zinc-800/80' : 'bg-zinc-900 border border-zinc-700'}`}
                          >
                            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
                            {msg.formDraft && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-zinc-200 text-zinc-900 hover:bg-zinc-100"
                                  onClick={() => approveAndApplyDraft(msg.formDraft, msg.verificationQuestion)}
                                >
                                  Apply
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2 text-xs bg-zinc-800 hover:bg-zinc-700"
                                  onClick={() => {
                                    const ask = msg.verificationQuestion || 'Revise this draft with these changes:'
                                    setAgentInput(ask)
                                  }}
                                >
                                  Revise
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <input
                      ref={agentFileInputRef}
                      type="file"
                      multiple
                      accept=".csv,.txt,.json,.md,.log,text/*,application/json"
                      onChange={handleAgentFileUpload}
                      className="hidden"
                    />

                    {agentUploads.length > 0 && (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-2">
                        <p className="text-[11px] text-zinc-500 mb-2">Recent uploads</p>
                        <div className="flex flex-wrap gap-2">
                          {agentUploads.slice(0, 6).map(file => (
                            <span key={file.id} className="text-xs px-2 py-1 rounded-md border border-zinc-700 bg-zinc-900/70 text-zinc-300">
                              {file.name} ({formatFileSize(file.size)})
                              {file.importedNumbers ? ` • ${file.importedNumbers} leads` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Textarea
                        value={agentInput}
                        onChange={(e) => setAgentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !agentLoading) {
                            e.preventDefault()
                            void askAgent()
                          }
                        }}
                        placeholder={`Tell ${activeAgentName} what you need.`}
                        className="min-h-[112px] md:min-h-[120px] bg-zinc-800 border-zinc-700 text-base"
                      />
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-2.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-10 sm:h-9 w-full sm:w-auto px-3 bg-zinc-800 hover:bg-zinc-700"
                              disabled={agentLoading}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-700">
                            <DropdownMenuItem
                              className="text-zinc-200 hover:bg-zinc-800"
                              onClick={() => agentFileInputRef.current?.click()}
                            >
                              Upload file
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-zinc-200 hover:bg-zinc-800"
                              onClick={() => setActiveTab('sources')}
                            >
                              Connect source
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-zinc-200 hover:bg-zinc-800"
                              onClick={() => {
                                const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : ''
                                if (!shareUrl) return
                                navigator.clipboard
                                  .writeText(shareUrl)
                                  .then(() => toast.success('Dashboard link copied'))
                                  .catch(() => toast.error('Could not copy link'))
                              }}
                            >
                              Share dashboard link
                            </DropdownMenuItem>
                            {agentProfiles.map(profile => (
                              <DropdownMenuItem
                                key={`start-${profile.id}`}
                                className="text-zinc-200 hover:bg-zinc-800"
                                onClick={() => startAgentSession(profile.id)}
                              >
                                Start {profile.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Select value={activeAgentId} onValueChange={setActiveAgentId}>
                          <SelectTrigger className="h-10 sm:h-9 w-full sm:min-w-[180px] bg-zinc-900 border-zinc-700 text-zinc-200">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {workspaceAgents.map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {`SAM - ${agent.name}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="h-10 sm:h-9 w-full sm:min-w-[160px] bg-zinc-900 border-zinc-700 text-zinc-200">
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {LANGUAGE_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant={liveVoiceCallEnabled ? 'default' : 'secondary'}
                          className={liveVoiceCallEnabled ? 'h-10 sm:h-9 w-full sm:w-auto bg-zinc-200 text-zinc-900 hover:bg-zinc-100' : 'h-10 sm:h-9 w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700'}
                          onClick={toggleLiveVoiceCall}
                          disabled={agentLoading}
                        >
                          {liveVoiceCallEnabled ? <Square className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                          {liveVoiceCallEnabled ? 'End Voice Call' : 'Voice Call'}
                        </Button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-[11px] text-zinc-500">
                          {liveVoiceCallEnabled
                            ? 'Voice call mode active. The assistant keeps listening after each reply.'
                            : 'You can type, upload files, or talk by voice.'}
                          {agentSpeaking ? ' Replying now…' : agentListening ? ' Listening…' : ''}
                        </p>
                        <Button className="h-10 w-full sm:w-auto" onClick={() => void askAgent()} disabled={agentLoading || !agentInput.trim()}>
                          {agentLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                          Send
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="call" className="space-y-6 animate-in fade-in-50 duration-200">
            <CallCenterTab 
              workspaceIntelligence={workspaceIntelligence}
              numbers={numbers}
              setNumbers={setNumbers}
              isCalling={isCalling}
              csvInputRef={csvInputRef}
              handleCsvImport={handleCsvImport}
              selectedCallerIdentityId={selectedCallerIdentityId}
              setSelectedCallerIdentityId={setSelectedCallerIdentityId}
              callerIdentities={callerIdentities}
              applyIdentityToComposer={applyIdentityToComposer}
              scheduledAt={scheduledAt}
              setScheduledAt={setScheduledAt}
              leadNotesText={leadNotesText}
              setLeadNotesText={setLeadNotesText}
              extractNumbers={extractNumbers}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              voices={voices}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              LANGUAGE_OPTIONS={LANGUAGE_OPTIONS}
              script={script}
              setScript={setScript}
              selectedCallerIdentity={selectedCallerIdentity}
              settings={settings}
              setSettings={setSettings}
              copilotMessages={copilotMessages}
              copilotInput={copilotInput}
              setCopilotInput={setCopilotInput}
              askCopilot={askCopilot}
              copilotLoading={copilotLoading}
              loading={loading}
              isConfigured={isConfigured}
              managedMode={managedMode || false}
              startCalling={startCalling}
              stopCalling={stopCalling}
              currentCampaign={currentCampaign}
              stats={stats}
              campaigns={campaigns}
              recordings={recordings}
              credits={credits}
              toast={toast}
              sampleCsvHref="/sample-leads.csv"
              onStartTestCall={startTestCallToMyNumber}
              testingCall={testingCall}
            />
          </TabsContent>

          <TabsContent value="sources" className="space-y-6 animate-in fade-in-50 duration-200">
            <LeadSourcesTab 
              leadSourceSettings={leadSourceSettings}
              setLeadSourceSettings={setLeadSourceSettings}
              copyWebhookUrl={copyWebhookUrl}
              rotateZapierWebhookKey={rotateZapierWebhookKey}
              savingLeadSources={savingLeadSources}
              loadingLeadInbox={loadingLeadInbox}
              pullLeadInboxToComposer={pullLeadInboxToComposer}
              syncGoogleDriveLeads={syncGoogleDriveLeads}
              syncingGoogleDrive={syncingGoogleDrive}
              saveLeadSourcesConfig={saveLeadSourcesConfig}
              integrationEvents={integrationEvents}
              getIntegrationStatusTone={getIntegrationStatusTone}
            />
          </TabsContent>

	          <TabsContent value="callers" className="space-y-6 animate-in fade-in-50 duration-200">
	            <VoiceAgentsTab 
                callerIdentities={callerIdentities}
                identityForm={identityForm}
                setIdentityForm={setIdentityForm}
                identityLoading={identityLoading}
                editingCallerIdentityId={editingCallerIdentityId}
                saveCallerIdentity={saveCallerIdentity}
                resetCallerIdentityForm={resetCallerIdentityForm}
                applyIdentityToComposer={applyIdentityToComposer}
                editCallerIdentity={editCallerIdentity}
                previewIdentityVoice={previewIdentityVoice}
                removeCallerIdentity={removeCallerIdentity}
                filteredIdentityVoices={filteredIdentityVoices}
                showAdvancedCallerInputs={showAdvancedCallerInputs}
                setShowAdvancedCallerInputs={setShowAdvancedCallerInputs}
                voicePreviewText={voicePreviewText}
                setVoicePreviewText={setVoicePreviewText}
                previewingVoice={previewingVoice}
                selectedIdentityVoice={selectedIdentityVoice}
                managedMode={managedMode || false}
                openNumberPurchaseModal={(id: string, name: string) => setNumberPurchaseModal({ callerIdentityId: id, identityName: name })}
                numberActivationPrice={numberActivationPrice}
                LANGUAGE_OPTIONS={LANGUAGE_OPTIONS}
                selectedCallerIdentityId={selectedCallerIdentityId}
                ttsHealth={ttsHealth}
                loadingTtsHealth={loadingTtsHealth}
              />
	          </TabsContent>

          <TabsContent value="recordings" className="space-y-6 animate-in fade-in-50 duration-200">
              <RecordingsTab 
                recordingSearch={recordingSearch}
                setRecordingSearch={setRecordingSearch}
                fetchRecordings={fetchRecordings}
                recordings={recordings}
                filteredRecordings={filteredRecordings}
                selectedRecording={selectedRecording}
                setSelectedRecording={setSelectedRecording}
                playRecording={playRecording}
                playingRecording={playingRecording}
                transcribeRecording={transcribeRecording}
                transcribing={transcribing}
                getSentimentColor={getSentimentColor}
              />
          </TabsContent>

          <TabsContent value="leads" className="space-y-6 animate-in fade-in-50 duration-200">
            <LeadsTab 
              leadSearch={leadSearch}
              setLeadSearch={setLeadSearch}
              fetchCampaigns={fetchCampaigns}
              setActiveTab={setActiveTab}
              filteredLeads={filteredLeads}
              formatDateTime={formatDateTime}
              contentInput={contentInput}
              setContentInput={setContentInput}
              submitContentInputToAgent={submitContentInputToAgent}
              agentLoading={agentLoading}
              leadLists={leadLists}
              selectedLeadList={selectedLeadList}
              onSelectLeadList={applyLeadListSelection}
              newLeadListName={newLeadListName}
              setNewLeadListName={setNewLeadListName}
              addLeadList={addLeadList}
            />
          </TabsContent>

          <TabsContent value="callbacks" className="space-y-6 animate-in fade-in-50 duration-200">
            <CallbacksTab 
              callbackFilter={callbackFilter}
              setCallbackFilter={setCallbackFilter}
              loadScheduledCallbacksToComposer={loadScheduledCallbacksToComposer}
              fetchCampaigns={fetchCampaigns}
              filteredCallbacks={filteredCallbacks}
              campaigns={campaigns}
              loadCampaignToComposer={loadCampaignToComposer}
              formatDateTime={formatDateTime}
              setActiveTab={setActiveTab}
              callbacksScheduled={callbacksScheduled}
              callbacksDueNow={callbacksDueNow}
              dailyReport={dailyReport}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6 animate-in fade-in-50 duration-200">
            <HistoryTab 
              campaigns={campaigns}
              loadCampaignToComposer={loadCampaignToComposer}
            />
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 animate-in fade-in-50 duration-200">
            <BillingTab 
              managedMode={managedMode || false}
              setActiveTab={setActiveTab}
              callerIdentities={callerIdentities}
              callerNumbersActive={callerNumbersActive}
              credits={credits}
              creditProducts={creditProducts}
              billingEvents={billingEvents}
              estimatedCostPer100={estimatedCostPer100}
              lowCreditThreshold={lowCreditThreshold}
              onPurchaseSuccess={result => {
                if (typeof result.credits === 'number') setCredits(result.credits)
                if (result.assignedPhoneNumber) fetchCallerIdentities()
                void fetchBillingEvents()
              }}
            />
          </TabsContent>

	          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-200" id="settings">
              <SettingsTab 
                settings={settings}
                setSettings={setSettings}
                setActiveTab={setActiveTab}
                teamForm={teamForm}
                setTeamForm={setTeamForm}
                addTeamMember={addTeamMember}
                teamLoading={teamLoading}
                teamMembers={teamMembers}
                toggleTeamMember={toggleTeamMember}
                removeTeamMember={removeTeamMember}
                complianceLeadNumber={complianceLeadNumber}
                setComplianceLeadNumber={setComplianceLeadNumber}
                exportComplianceLogs={exportComplianceLogs}
                deleteLeadAndSuppress={deleteLeadAndSuppress}
                complianceLoading={complianceLoading}
              />
              <Button 
                onClick={saveSettings}
                disabled={loading}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-sky-500 hover:bg-sky-400 shadow-xl shadow-sky-500/10"
              >
                {loading ? 'Saving Workspace...' : 'Save Global Settings'}
              </Button>
	          </TabsContent>
              </Tabs>
          </div>
        </div>
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 gap-1">
          {mobilePrimaryTabs.map(item => (
            <button
              key={`mobile-bottom-${item.tab}`}
              type="button"
              onClick={() => handleTabChange(item.tab)}
              className={`relative rounded-xl px-2 py-2.5 text-[10px] font-medium transition ${
                activeTab === item.tab
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
                  : 'text-zinc-400 bg-zinc-900/70 border border-zinc-800'
              }`}
            >
              <span className="flex flex-col items-center gap-1">
                <item.icon className={`w-4 h-4 ${activeTab === item.tab ? 'text-sky-300' : 'text-zinc-500'}`} />
                <span className="truncate max-w-full">{item.label}</span>
              </span>
              {item.badge ? (
                <span className="absolute -top-1 -right-1 px-1 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {numberPurchaseModal && (
        <PayPalCheckoutModal
          open={!!numberPurchaseModal}
          onClose={() => setNumberPurchaseModal(null)}
          productId="number_activation"
          productName={`Dedicated Number — ${numberPurchaseModal.identityName}`}
          price={numberActivationPrice}
          callerIdentityId={numberPurchaseModal.callerIdentityId}
          onSuccess={result => {
            setNumberPurchaseModal(null)
            if (result.assignedPhoneNumber) fetchCallerIdentities()
          }}
        />
      )}
    </div>
  )
}
