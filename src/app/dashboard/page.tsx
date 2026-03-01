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
  TimerReset
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

const PREFERRED_ELEVENLABS_VOICES: Record<'female' | 'male', string[]> = {
  female: ['21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld', 'EXAVITQu4vr4xnSDxMaL', 'MF3mGyEYCl7XYWbV9V6O'],
  male: ['ErXwobaYiN019PkySvjV', 'TxGEqnHWrfWFT1GWmBXj', 'pNInz6obpgDQGcFmaJgB', 'VR6AewLTigWG4xSOukaG'],
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
  {
    id: 'maya',
    name: 'Maya',
    language: 'English',
    style: 'Empathetic and patient',
    expertise: 'Qualification and discovery',
    intro: 'Best for early-stage qualification and detailed need discovery.',
  },
  {
    id: 'omar',
    name: 'Omar',
    language: 'Arabic',
    style: 'Direct and professional',
    expertise: 'Appointment setting',
    intro: 'Best for securing appointment slots and confirming attendance.',
  },
  {
    id: 'lina',
    name: 'Lina',
    language: 'English/Arabic',
    style: 'Warm and consultative',
    expertise: 'Retention and upsell',
    intro: 'Best for renewals, account expansion, and long-term relationship calls.',
  },
  {
    id: 'noah',
    name: 'Noah',
    language: 'English',
    style: 'Executive and structured',
    expertise: 'B2B discovery',
    intro: 'Best for enterprise qualification and decision-maker mapping.',
  },
]

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

  return score
}

export default function Dashboard() {
  // Settings state
  const [settings, setSettings] = useState<Settings>({
    voiceEngineApiKey: '',
    telephonyAccountSid: '',
    telephonyAuthToken: '',
    telephonyPhoneNumber: '',
    forwardToNumber: '',
    recordCalls: true,
    transcribeCalls: true,
    openaiApiKey: '',
    managedMode: false,
    assignedPhoneNumber: '',
    businessName: '',
    industry: '',
    companyDetails: '',
    sayThisRules: '',
    avoidThisRules: '',
  })
  const [credits, setCredits] = useState(0)
  const [isConfigured, setIsConfigured] = useState(false)
  const [managedMode, setManagedMode] = useState(false)
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
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM')
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [voices, setVoices] = useState<Voice[]>([])
  const [callerIdentities, setCallerIdentities] = useState<CallerIdentity[]>([])
  const [selectedCallerIdentityId, setSelectedCallerIdentityId] = useState('')
  const [identityForm, setIdentityForm] = useState({
    name: '',
    position: '',
    gender: 'any',
    language: 'en-US',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    industry: '',
    mentionAi: false,
    campaignGoal: '',
    script: '',
    sayThisRules: '',
    avoidThisRules: '',
  })
  const [identityLoading, setIdentityLoading] = useState(false)
  const [editingCallerIdentityId, setEditingCallerIdentityId] = useState<string | null>(null)
  const [voicePreviewText, setVoicePreviewText] = useState('Hi, this is Sara from Acaller. I wanted to share a quick update about our latest launch and see if this is relevant for you.')
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
  const csvInputRef = useRef<HTMLInputElement>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState('agents')
  const [leadSearch, setLeadSearch] = useState('')
  const [callbackFilter, setCallbackFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
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
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false)
  const [liveVoiceCallEnabled, setLiveVoiceCallEnabled] = useState(false)
  const [agentListening, setAgentListening] = useState(false)
  const [agentSpeaking, setAgentSpeaking] = useState(false)
  const [newAgentDraftNames, setNewAgentDraftNames] = useState<Record<string, string>>({})
  const [showAdvancedCallerInputs, setShowAdvancedCallerInputs] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamForm, setTeamForm] = useState({ name: '', email: '', role: 'Agent' })
  const [teamLoading, setTeamLoading] = useState(false)
  const [billingProducts, setBillingProducts] = useState<Record<string, BillingProduct>>(DEFAULT_BILLING_PRODUCTS)
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
      voiceId: identity.voiceId || '21m00Tcm4TlvDq8ikWAM',
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

    if (!isNaturalVoice(voice)) {
                        toast.error('Preview is available for high-quality natural voices. Choose a natural voice for testing.')
    }

    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause()
      voicePreviewAudioRef.current.currentTime = 0
    }

    setPreviewingVoice(chosenVoiceId)
    try {
      const url = `/api/calls/tts?script=${encodeURIComponent(text)}&voiceId=${encodeURIComponent(chosenVoiceId)}&language=${encodeURIComponent(chosenLanguage)}`
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
        return parsed.filter(item => item?.id && item?.profileId && item?.name)
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
        setSettings(data.settings)
        setCredits(typeof data.credits === 'number' ? data.credits : 0)
        setIsConfigured(!!data.isConfigured)
        setManagedMode(!!data.settings?.managedMode)
        setAssignedPhoneNumber(data.settings?.assignedPhoneNumber || '')
        setIdentityForm(prev => ({
          ...prev,
          industry: data.settings?.industry || '',
          sayThisRules: data.settings?.sayThisRules || '',
          avoidThisRules: data.settings?.avoidThisRules || '',
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
        setVoices([
          { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade', labels: { gender: 'female', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
          { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade', labels: { gender: 'female', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
          { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade', labels: { gender: 'male', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
          { id: 'TxGEqnHWrfWFT1GWmBXj', name: 'Josh', category: 'premade', labels: { gender: 'male', language: 'en-US' }, source: 'elevenlabs', language: 'en-US' },
        ])
      }
      
      await Promise.all([
        fetchCampaigns(),
        fetchRecordings(),
        fetchTeamMembers(),
        fetchBillingProducts(),
        fetchCallerIdentities(),
        fetchLeadSources(),
      ])
    }
    
    init()
  }, [fetchCampaigns, fetchRecordings, fetchTeamMembers, fetchBillingProducts, fetchCallerIdentities, fetchLeadSources])

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
            businessName: settings.businessName || 'Auto Caller',
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
    if (action === 'open_callers') return 'Callers'
    if (action === 'open_settings') return 'Settings'
    return ''
  }

  const agentActionToTab = (action?: AgentAction) => {
    if (!action || action === 'none') return null
    if (action === 'open_billing') return 'billing'
    if (action === 'open_call') return 'call'
    if (action === 'open_callers') return 'callers'
    if (action === 'open_settings') return 'settings'
    return null
  }

  const getIntelligenceStatusTone = (status: WorkspaceIntelligence['status']) => {
    if (status === 'critical') return 'text-red-300 bg-red-500/15 border-red-500/30'
    if (status === 'needs_attention') return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    if (status === 'ready') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
    return 'text-blue-300 bg-blue-500/15 border-blue-500/30'
  }

  const getPriorityTone = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return 'text-red-300 bg-red-500/15 border-red-500/30'
    if (priority === 'medium') return 'text-amber-300 bg-amber-500/15 border-amber-500/30'
    return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
  }

  const getIntegrationStatusTone = (status: IntegrationActivityEvent['status']) => {
    if (status === 'success') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
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
      'Create caller identity with voice and language',
      'Upload numbers and launch or schedule campaign',
    ],
  })

  const startAgentSession = (profileId: string, customName = '') => {
    const profile = agentProfiles.find(agent => agent.id === profileId) || agentProfiles[0]
    if (!profile) return
    const now = new Date().toISOString()
    const nextAgentId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const safeName = customName.trim() || profile.name

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
    setNewAgentDraftNames(prev => ({ ...prev, [profile.id]: '' }))
    setAgentInput('')

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
            managedMode,
            currentTab: activeTab,
            targetBlueprint: script,
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
    if (!currentCampaign) return { total: 0, connected: 0, failed: 0, pending: 0 }
    
    const results = currentCampaign.results || []
    return {
      total: currentCampaign.numbers?.length || 0,
      connected: results.filter(r => r.status === 'connected').length,
      failed: results.filter(r => r.status === 'failed').length,
      pending: (currentCampaign.numbers?.length || 0) - results.length,
    }
  }

  const stats = getStats()
  
  // Get sentiment color
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-400 bg-emerald-500/20'
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
          trendColor: successRate > 50 ? 'text-emerald-400' : 'text-amber-400',
          icon: TrendingUp,
        }
      : null,
    transcribedCount > 0
      ? {
          label: 'Transcribed',
          value: transcribedCount,
          description: 'Calls with full AI analysis',
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
      label: 'Create a caller identity',
      done: callerIdentities.length > 0,
      tab: 'callers',
    },
    {
      label: managedMode ? 'Buy number + credits' : 'Set calling and billing',
      done: managedMode ? (credits > 0 && callerNumbersActive > 0) : isConfigured,
      tab: managedMode ? 'billing' : 'settings',
    },
    {
      label: 'Launch first campaign',
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
  const isNewWorkspace = campaigns.length === 0 && callerIdentities.length === 0 && teamMembers.length === 0
  const shouldStartWithAgent = isNewWorkspace && !agentSessionStarted

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
        ? 'Chat with your AI assistant to plan campaigns and review outcomes.'
      : activeTab === 'call'
        ? 'Upload numbers and start or schedule campaigns.'
      : activeTab === 'sources'
        ? 'Connect Zapier/Facebook and Google Drive to feed your lead inbox.'
      : activeTab === 'callers'
        ? 'Create and manage your voice agents and outreach behaviors.'
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

  const callerIdentityManager = (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          Voice Agents
        </CardTitle>
        <CardDescription>
          Create and manage your voice profiles. Assign every campaign to an agent with a natural voice, language, and target behavior.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-sm text-zinc-200">Conversation-first mode is active.</p>
          <p className="text-xs text-zinc-400 mt-1">
            Keep this form minimal. Your agent chat will collect strategy details, rules, and goals over time.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Caller name (e.g., Sara)"
            value={identityForm.name}
            onChange={e => setIdentityForm(prev => ({ ...prev, name: e.target.value }))}
            className="bg-zinc-800 border-zinc-700"
          />
          <Input
            placeholder="Position (e.g., Sales Advisor)"
            value={identityForm.position}
            onChange={e => setIdentityForm(prev => ({ ...prev, position: e.target.value }))}
            className="bg-zinc-800 border-zinc-700"
          />
          <Select value={identityForm.gender} onValueChange={(value) => setIdentityForm(prev => ({ ...prev, gender: value }))}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
            </SelectContent>
          </Select>
          <Select value={identityForm.language} onValueChange={(value) => setIdentityForm(prev => ({ ...prev, language: value }))}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={identityForm.voiceId} onValueChange={(value) => setIdentityForm(prev => ({ ...prev, voiceId: value }))}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {filteredIdentityVoices.map(voice => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name} ({voice.labels?.gender || 'N/A'}) • {voice.language || voice.labels?.language || 'multi'} {isNaturalVoice(voice) ? '• Natural' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-zinc-500">
          Voice list is filtered by selected gender + language. Most human voices are listed first.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <div>
            <p className="text-sm font-medium text-zinc-200">Advanced caller inputs</p>
            <p className="text-xs text-zinc-500">Only open this if you want to manually override what the agent already collected.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="bg-zinc-800 hover:bg-zinc-700"
            onClick={() => setShowAdvancedCallerInputs(prev => !prev)}
          >
            {showAdvancedCallerInputs ? 'Hide Advanced' : 'Show Advanced'}
          </Button>
        </div>
        {showAdvancedCallerInputs && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Industry override (optional)"
                value={identityForm.industry}
                onChange={e => setIdentityForm(prev => ({ ...prev, industry: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
              <Input
                placeholder="Campaign goal (new launch, follow-up, reactivation...)"
                value={identityForm.campaignGoal}
                onChange={e => setIdentityForm(prev => ({ ...prev, campaignGoal: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-3">
          <p className="text-sm font-medium text-zinc-200">Voice Quality Test</p>
          <Textarea
            placeholder="Sample text for voice preview"
            value={voicePreviewText}
            onChange={e => setVoicePreviewText(e.target.value)}
            className="min-h-[88px] bg-zinc-900 border-zinc-700"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-zinc-500">
              Selected voice: {selectedIdentityVoice ? `${selectedIdentityVoice.name} (${selectedIdentityVoice.language || selectedIdentityVoice.labels?.language || 'multi'})` : 'None'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="bg-zinc-800 hover:bg-zinc-700"
                onClick={() => {
                  if (!filteredIdentityVoices[0]) return
                  setIdentityForm(prev => ({ ...prev, voiceId: filteredIdentityVoices[0].id }))
                  toast.success(`Auto-selected ${filteredIdentityVoices[0].name}`)
                }}
                disabled={filteredIdentityVoices.length === 0}
              >
                Pick Best Voice
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="bg-zinc-800 hover:bg-zinc-700"
                onClick={() => previewIdentityVoice(identityForm.voiceId, identityForm.language)}
                disabled={!identityForm.voiceId || !!previewingVoice}
              >
                {previewingVoice === identityForm.voiceId ? 'Playing...' : 'Test Voice'}
              </Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Textarea
            placeholder='Identity "say this" rules'
            value={identityForm.sayThisRules}
            onChange={e => setIdentityForm(prev => ({ ...prev, sayThisRules: e.target.value }))}
            className="min-h-[80px] bg-zinc-800 border-zinc-700"
          />
          <Textarea
            placeholder='Identity "avoid this" rules'
            value={identityForm.avoidThisRules}
            onChange={e => setIdentityForm(prev => ({ ...prev, avoidThisRules: e.target.value }))}
            className="min-h-[80px] bg-zinc-800 border-zinc-700"
          />
        </div>
        <div className="space-y-2">
          <Label>Identity Target Blueprint</Label>
          <Textarea
            placeholder={"Goal: qualify and transfer\nAudience: first-time buyers\nOffer: new launch with flexible plan\nQualification: budget, timeline, decision maker\nCTA: connect to specialist"}
            value={identityForm.script}
            onChange={e => setIdentityForm(prev => ({ ...prev, script: e.target.value }))}
            className="min-h-[96px] bg-zinc-800 border-zinc-700"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <div>
            <p className="text-sm font-medium">AI Disclosure</p>
            <p className="text-xs text-zinc-500">If enabled, opening line says caller is an AI assistant.</p>
          </div>
          <Switch
            checked={identityForm.mentionAi}
            onCheckedChange={(checked) => setIdentityForm(prev => ({ ...prev, mentionAi: checked }))}
          />
        </div>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={saveCallerIdentity}
            disabled={identityLoading}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            {identityLoading ? 'Saving...' : (editingCallerIdentityId ? 'Update Caller Identity' : 'Create New Caller')}
          </Button>
          {editingCallerIdentityId && (
            <Button
              type="button"
              variant="secondary"
              className="bg-zinc-800 hover:bg-zinc-700"
              onClick={resetCallerIdentityForm}
              disabled={identityLoading}
            >
              Cancel Edit
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {callerIdentities.length === 0 ? (
            <p className="text-sm text-zinc-500">No caller identities yet.</p>
          ) : (
            callerIdentities.map(identity => {
              const successRate = identity.totalCalls > 0
                ? Math.round((identity.connectedCalls / identity.totalCalls) * 100)
                : 0
              const isActive = selectedCallerIdentityId === identity.id
              return (
                <div key={identity.id} className={`rounded-lg border p-3 ${isActive ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/40'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {identity.name} <span className="text-zinc-500">({identity.position})</span>
                      </p>
                      <p className="text-xs text-zinc-400">
                        {identity.gender} • {identity.language} • {identity.industry || settings.industry || 'General'} • Voice {identity.voiceId}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Dedicated Number: {identity.dedicatedNumber || 'Not purchased'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Calls {identity.totalCalls} • Connected {identity.connectedCalls} • Success {successRate}% • Credits {identity.creditsUsed}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!identity.dedicatedNumber && managedMode && (
                        <Button
                          type="button"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => setNumberPurchaseModal({ callerIdentityId: identity.id, identityName: identity.name })}
                        >
                          {`Buy Number - $${numberActivationPrice.toFixed(2)}`}
                        </Button>
                      )}
                      {identity.dedicatedNumber && (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          Number Active
                        </Badge>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => applyIdentityToComposer(identity)}
                      >
                        Use
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => editCallerIdentity(identity)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700"
                        onClick={() => previewIdentityVoice(identity.voiceId, identity.language)}
                        disabled={!!previewingVoice}
                      >
                        {previewingVoice === identity.voiceId ? 'Playing...' : 'Preview'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-300 hover:text-red-200"
                        onClick={() => removeCallerIdentity(identity.id)}
                        disabled={identityLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen flex bg-zinc-950 text-white">
      {/* Hidden audio elements */}
      <audio ref={audioRef} onEnded={() => setPlayingRecording(null)} />
      <audio ref={voicePreviewAudioRef} onEnded={() => setPreviewingVoice(null)} />
      <audio ref={agentVoiceAudioRef} onEnded={handleAgentVoicePlaybackEnded} onPause={handleAgentVoicePlaybackEnded} />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-60 border-r border-zinc-800/70 bg-zinc-900/60 backdrop-blur-xl flex flex-col z-30 overflow-hidden">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 ring-1 ring-emerald-400/20 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight truncate text-white">Auto Caller</p>
              <p className="text-[10px] text-zinc-500 truncate">AI Outreach Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {([
            { tab: 'overview', icon: LayoutDashboard, label: 'Overview', badge: null },
            { tab: 'agents', icon: Bot, label: 'Assistant', badge: null },
            { tab: 'call', icon: Phone, label: 'Call Center', badge: null },
            { tab: 'sources', icon: Download, label: 'Lead Sources', badge: null },
            { tab: 'callers', icon: Users, label: 'Voice Agents', badge: null },
            { tab: 'recordings', icon: Mic, label: 'Recordings', badge: null },
            { tab: 'leads', icon: ClipboardList, label: 'Leads', badge: null },
            { tab: 'callbacks', icon: CalendarClock, label: 'Callbacks', badge: callbacksDueNow > 0 ? String(callbacksDueNow) : null },
            { tab: 'history', icon: History, label: 'History', badge: null },
            { tab: 'billing', icon: Wallet, label: 'Billing', badge: null },
            { tab: 'settings', icon: Settings, label: 'Settings', badge: null },
          ]).map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => handleTabChange(item.tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === item.tab
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.tab ? 'text-emerald-400' : 'text-zinc-500'}`} />
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
              <span className="text-xs font-semibold text-emerald-400">{callerNumbersActive}/{callerIdentities.length}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/40 border border-zinc-700/40">
            <span className="text-[11px] text-zinc-500">Credits</span>
            <span className="text-sm font-bold text-emerald-400">{credits}</span>
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
      <div className="pl-60 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl shrink-0">
          <div className="px-6 md:px-8 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-medium">Workspace</p>
              <h1 className="text-xl font-semibold tracking-tight truncate">{activeTabTitle}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
              {isCalling && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400">Running</span>
                </div>
              )}
              {managedMode && (
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Managed</Badge>
              )}
              {isConfigured ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Configured
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  <Settings className="w-3 h-3 mr-1" />
                  Setup Required
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 md:px-10 py-8 space-y-8">
        {topStats.length > 0 && (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

        <div className={`grid gap-10 ${agentSessionStarted ? 'xl:grid-cols-[420px_minmax(0,1fr)]' : ''}`}>
          {agentSessionStarted && (
            <aside className="xl:sticky xl:top-24 xl:h-[calc(100vh-7rem)]">
              <Card className="h-full bg-zinc-900/90 border-zinc-800 shadow-lg shadow-black/30">
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      Agent Chat
                    </CardTitle>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 max-w-[180px] truncate">
                      {activeAgentName}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {activeAgentProfile?.language} • {activeAgentProfile?.expertise}
                  </p>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-2">
                    <span className="text-xs text-zinc-400">{workspaceAgents.length} active agents in this account</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="bg-zinc-800 hover:bg-zinc-700"
                      onClick={() => setActiveTab('agents')}
                    >
                      Open Agents
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-8rem)] flex flex-col gap-3">
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
                          className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-zinc-800/80' : 'bg-emerald-500/10 border border-emerald-500/20'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs uppercase tracking-wide text-zinc-400">{msg.role === 'user' ? 'You' : activeAgentName}</p>
                            {msg.role === 'assistant' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="bg-zinc-800 hover:bg-zinc-700 text-xs"
                                onClick={() => speakAgentMessage(msg.content)}
                              >
                                Voice
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
                          {msg.checklist && msg.checklist.length > 0 && (
                            <ul className="mt-2 text-xs text-zinc-300 space-y-1">
                              {msg.checklist.map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          )}
                          {msg.action && msg.action !== 'none' && getActionLabel(msg.action) && (
                            <p className="mt-2 text-xs text-zinc-400">
                              Suggested workspace: <span className="text-emerald-300">{getActionLabel(msg.action)}</span>
                            </p>
                          )}
                          {!!msg.actionReason && (
                            <p className="mt-1 text-xs text-zinc-500">
                              Why: {msg.actionReason}
                            </p>
                          )}
                          {typeof msg.confidence === 'number' && msg.confidence > 0 && (
                            <p className="mt-1 text-xs text-zinc-500">
                              Confidence: {Math.max(0, Math.min(100, Math.round(msg.confidence)))}%
                              {msg.conversationMode ? ` • ${msg.conversationMode}` : ''}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {activeAgentId && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-2">
                      <p className="text-[11px] text-zinc-500 mb-2">Onboarding with one tap</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Set up my first caller identity with best voice and language.',
                          'Guide me to connect forwarding and compliance settings.',
                          'Help me import leads and schedule my first campaign.',
                          'Check if my credits and number setup are enough to launch.',
                        ].map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            className="text-xs px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-emerald-500/40 hover:bg-zinc-800"
                            onClick={() => void sendOnboardingPrompt(prompt)}
                            disabled={agentLoading}
                          >
                            {prompt.length > 54 ? `${prompt.slice(0, 54)}...` : prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={voiceChatEnabled ? 'default' : 'secondary'}
                        className={voiceChatEnabled ? '' : 'bg-zinc-800 hover:bg-zinc-700'}
                        onClick={() => {
                          if (liveVoiceCallEnabled) {
                            toast.error('End Live Call first to disable voice mode')
                            return
                          }
                          const next = !voiceChatEnabled
                          setVoiceChatEnabled(next)
                          if (!next) {
                            stopAgentListening()
                            stopAgentVoicePlayback()
                          }
                        }}
                        disabled={!activeAgentId}
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        {voiceChatEnabled ? 'Voice On' : 'Voice Off'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className={agentListening ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-800 hover:bg-zinc-700'}
                        onClick={agentListening ? stopAgentListening : startAgentListening}
                        disabled={!activeAgentId || agentLoading || liveVoiceCallEnabled}
                      >
                        {agentListening ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                        {agentListening ? 'Listening…' : 'Talk'}
                      </Button>
                      <Button
                        type="button"
                        variant={liveVoiceCallEnabled ? 'default' : 'secondary'}
                        className={liveVoiceCallEnabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-800 hover:bg-zinc-700'}
                        onClick={toggleLiveVoiceCall}
                        disabled={!activeAgentId || agentLoading}
                      >
                        {liveVoiceCallEnabled ? <Square className="w-4 h-4 mr-2" /> : <Phone className="w-4 h-4 mr-2" />}
                        {liveVoiceCallEnabled ? 'End Live' : 'Start Live'}
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
                      className="bg-zinc-800 border-zinc-700"
                      disabled={!activeAgentId}
                    />
                    <Button onClick={() => void askAgent()} disabled={agentLoading || !agentInput.trim() || !activeAgentId}>
                      {agentLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                    <p className="text-[11px] text-zinc-500">
                      {liveVoiceCallEnabled
                        ? 'Live call mode is active: speak naturally, wait for reply, and the mic re-opens automatically.'
                        : 'Voice mode: press Talk, speak naturally, and the agent replies back in voice using your selected caller voice.'}
                      {agentSpeaking ? ' Replying now…' : agentListening ? ' Listening…' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}

          <div className="space-y-6 min-w-0">
            {shouldStartWithAgent && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    Hire an agent
                  </CardTitle>
                  <CardDescription>
                    Choose who should run your onboarding. After you start, chat stays on the left while you build campaigns on the right.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {agentProfiles.map(profile => (
                      <div key={profile.id} className="min-w-[260px] rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
                        <div>
                          <p className="text-base font-semibold text-zinc-100">{profile.name}</p>
                          <p className="text-xs text-zinc-400">{profile.language} • {profile.style}</p>
                        </div>
                        <p className="text-sm text-zinc-300">{profile.expertise}</p>
                        <p className="text-xs text-zinc-500">{profile.intro}</p>
                        <Button type="button" className="w-full" onClick={() => startAgentSession(profile.id)}>
                          Start with {profile.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Available agents are fully aware of your callers, campaigns, numbers, credits, callback queue, and target blueprint.
                  </p>
                </CardContent>
              </Card>
            )}

            {!shouldStartWithAgent && (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                {activeTab === 'overview' && nextStep && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-sm text-zinc-400">{activeTabHint}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab(nextStep.tab)}
                      className="text-xs text-emerald-300 hover:text-emerald-200 underline underline-offset-2 shrink-0"
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
            />
          </TabsContent>

          <TabsContent value="agents" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  Agent Command Center
                </CardTitle>
                <CardDescription>
                  Chat and live voice are always on the left. Use this page to trigger onboarding tasks without filling long forms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Create Caller Identity',
                      prompt: 'Create my first caller identity and choose the most human voice for my language.',
                    },
                    {
                      label: 'Connect Calling Setup',
                      prompt: 'Set my forwarding number, quiet hours, and compliance settings so I can launch safely.',
                    },
                    {
                      label: 'Import Leads + Schedule',
                      prompt: 'Help me import my lead list and schedule the first campaign with the best timing.',
                    },
                    {
                      label: 'Launch Readiness Check',
                      prompt: 'Run a full launch readiness check and tell me exactly what is missing.',
                    },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      type="button"
                      variant="secondary"
                      className="h-auto py-4 px-4 bg-zinc-800/60 hover:bg-zinc-700/70 justify-start text-left whitespace-normal"
                      onClick={() => void sendOnboardingPrompt(item.prompt)}
                      disabled={agentLoading}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Your Active Agents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {workspaceAgents.length === 0 ? (
                        <p className="text-sm text-zinc-500">No active agents yet. Hire one below to begin onboarding.</p>
                      ) : (
                        workspaceAgents.map(agent => {
                          const profile = agentProfiles.find(item => item.id === agent.profileId)
                          const isActive = agent.id === activeAgentId
                          const historyCount = agentMessagesByAgent[agent.id]?.length || 0
                          return (
                            <button
                              key={agent.id}
                              type="button"
                              onClick={() => setActiveAgentId(agent.id)}
                              className={`w-full rounded-lg border p-3 text-left transition ${
                                isActive
                                  ? 'border-emerald-500/40 bg-emerald-500/10'
                                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                              }`}
                            >
                              <p className="text-sm font-medium text-zinc-100">{agent.name}</p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {profile?.language || 'multi'} • {profile?.expertise || 'general'} • {historyCount} messages
                              </p>
                            </button>
                          )
                        })
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-950/40 border-zinc-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Hire Another Agent</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {agentProfiles.map(profile => (
                        <div key={profile.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
                          <div>
                            <p className="text-sm font-medium text-zinc-100">{profile.name}</p>
                            <p className="text-xs text-zinc-500">{profile.language} • {profile.expertise}</p>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={newAgentDraftNames[profile.id] || ''}
                              onChange={e => setNewAgentDraftNames((prev: Record<string, string>) => ({ ...prev, [profile.id]: e.target.value }))}
                              placeholder={`Name for ${profile.name}`}
                              className="bg-zinc-800 border-zinc-700"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              className="bg-zinc-800 hover:bg-zinc-700"
                              onClick={() => startAgentSession(profile.id, newAgentDraftNames[profile.id] || '')}
                            >
                              Hire
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
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
                settings={settings}
                selectedCallerIdentityId={selectedCallerIdentityId}
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
              onPurchaseSuccess={result => {
                if (typeof result.credits === 'number') setCredits(result.credits)
                if (result.assignedPhoneNumber) fetchCallerIdentities()
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
              />
              <Button 
                onClick={saveSettings}
                disabled={loading}
                className="w-full h-14 rounded-2xl text-lg font-bold bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/10"
              >
                {loading ? 'Saving Workspace...' : 'Save Global Settings'}
              </Button>
	          </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
        </main>
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
