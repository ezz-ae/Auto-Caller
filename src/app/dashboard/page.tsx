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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface Settings {
  elevenLabsApiKey: string
  twilioAccountSid: string
  twilioAuthToken: string
  twilioPhoneNumber: string
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
  action?: 'none' | 'open_billing' | 'open_call' | 'open_callers' | 'open_settings'
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

interface IntegrationActivityEvent {
  id: string
  source: string
  status: 'success' | 'warning' | 'error'
  message: string
  importedCount: number
  createdAt: string
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

function scoreVoiceForIdentity(voice: Voice, targetGender: 'female' | 'male' | 'any', targetLanguage: string): number {
  const voiceGender = normalizeGender(voice.labels?.gender)
  const voiceLanguage = String(voice.language || voice.labels?.language || '').trim().toLowerCase()
  const voiceLanguageBase = languageBase(voiceLanguage)
  const targetLanguageNormalized = targetLanguage.trim().toLowerCase()
  const targetLanguageBase = languageBase(targetLanguageNormalized)

  let score = 0

  if (voice.source === 'elevenlabs') score += 120
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
    elevenLabsApiKey: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
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
  const csvInputRef = useRef<HTMLInputElement>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview')
  const [leadSearch, setLeadSearch] = useState('')
  const [callbackFilter, setCallbackFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')
  const [loading, setLoading] = useState(false)
  const [purchasingProduct, setPurchasingProduct] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
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
    const elevenVoices = voices.filter(voice => voice.source === 'elevenlabs')
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

    if (voice.source !== 'elevenlabs') {
      toast.error('Preview is available for ElevenLabs voices. Choose an ElevenLabs voice for natural quality testing.')
      return
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
    if (redirectUrl) {
      window.location.href = redirectUrl
    }
  }, [redirectUrl])

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
      return
    }
    if (!activeAgentId || !workspaceAgents.some(agent => agent.id === activeAgentId)) {
      setActiveAgentId(workspaceAgents[0].id)
    }
  }, [workspaceAgents, activeAgentId])

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
        if (nextAssigned && nextAssigned !== settings.twilioPhoneNumber) {
          setSettings(prev => ({ ...prev, twilioPhoneNumber: nextAssigned, assignedPhoneNumber: nextAssigned }))
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

  const purchaseProduct = async (productId: string, callerIdentityId?: string) => {
    const purchaseKey = callerIdentityId ? `${productId}:${callerIdentityId}` : productId
    setPurchasingProduct(purchaseKey)
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          callerIdentityId,
        }),
      })

      const data = await res.json()

      if (data.approvalUrl) {
        setRedirectUrl(data.approvalUrl)
      } else {
        toast.error(data.error || 'Failed to create payment order')
      }
    } catch {
      toast.error('Failed to start payment')
    } finally {
      setPurchasingProduct(null)
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

  const speakAgentMessage = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Voice playback is not supported in this browser')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  const getActionLabel = (action?: AgentMessage['action']) => {
    if (!action || action === 'none') return ''
    if (action === 'open_billing') return 'Billing'
    if (action === 'open_call') return 'Call Center'
    if (action === 'open_callers') return 'Callers'
    if (action === 'open_settings') return 'Settings'
    return ''
  }

  const agentActionToTab = (action?: AgentMessage['action']) => {
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
    setActiveTab('overview')
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

  const askAgent = async () => {
    if (!activeAgentId) {
      toast.error('Create an agent first from Hire an agent or Agents tab')
      setActiveTab('agents')
      return
    }

    const prompt = agentInput.trim()
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

      const suggestedTab = agentActionToTab(assistantMessage.action)
      if (suggestedTab && (assistantMessage.confidence || 0) >= 90) {
        setActiveTab(suggestedTab)
        toast.success(`Opened ${getActionLabel(assistantMessage.action)} based on ${activeAgentName}'s recommendation`)
      }
    } catch {
      toast.error('Agent is unavailable')
    } finally {
      setAgentLoading(false)
    }
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
        ? 'Agents'
      : activeTab === 'call'
        ? 'Call Center'
      : activeTab === 'sources'
        ? 'Lead Sources'
      : activeTab === 'callers'
        ? 'Callers'
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
        ? 'Create agents and review each agent conversation history.'
      : activeTab === 'call'
        ? 'Upload numbers and start or schedule campaigns.'
      : activeTab === 'sources'
        ? 'Connect Zapier/Facebook and Google Drive to feed your lead inbox.'
      : activeTab === 'callers'
        ? 'Create and manage caller identities and target blueprints.'
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
          Caller Identities
        </CardTitle>
        <CardDescription>
          Create and manage caller profiles. Assign every campaign to a caller identity with voice, language, and target behavior.
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
                  {voice.name} ({voice.labels?.gender || 'N/A'}) • {voice.language || voice.labels?.language || 'multi'} {voice.source === 'elevenlabs' ? '• Natural' : ''}
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
            placeholder={"Goal: qualify and transfer\nAudience: first-time buyers\nOffer: new launch with flexible plan\nQualification: need, budget, timeline\nCTA: connect to specialist"}
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
                          onClick={() => purchaseProduct('number_activation', identity.id)}
                          disabled={purchasingProduct === `number_activation:${identity.id}`}
                        >
                          {purchasingProduct === `number_activation:${identity.id}`
                            ? 'Processing...'
                            : `Buy Number - $${numberActivationPrice.toFixed(2)}`}
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a2b24_0%,#0a0a0b_40%,#09090b_100%)] text-white">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingRecording(null)} />
      <audio ref={voicePreviewAudioRef} onEnded={() => setPreviewingVoice(null)} />
      
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 ring-1 ring-emerald-300/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Auto Caller Platform</h1>
              <p className="text-xs text-zinc-400">Managed outbound calls and follow-ups in one workspace.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab(managedMode ? 'billing' : 'settings')}
              className="text-xs text-zinc-400 hover:text-emerald-400 transition"
            >
              {managedMode ? 'Billing' : 'Setup'}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
            {managedMode && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700">
                <span className="text-xs text-zinc-400">Caller Numbers:</span>
                <span className="text-xs font-semibold text-emerald-400">{callerNumbersActive}/{callerIdentities.length}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700">
              <span className="text-xs text-zinc-400">Credits:</span>
              <span className="text-sm font-bold text-emerald-400">{credits}</span>
            </div>
            {managedMode && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                Managed Mode
              </Badge>
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
      <main className="w-full px-4 md:px-6 py-6 space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-lg shadow-black/30">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total Calls</p>
              <p className="text-2xl font-semibold mt-1">{totalCalls}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-lg shadow-black/30">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Success Rate</p>
              <p className="text-2xl font-semibold mt-1 text-emerald-400">{successRate}%</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-lg shadow-black/30">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Transcribed</p>
              <p className="text-2xl font-semibold mt-1">{transcribedCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900/80 border-zinc-800 shadow-lg shadow-black/30">
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Workspace</p>
              <p className="text-base font-semibold mt-1 text-zinc-200">{activeTabTitle}</p>
            </CardContent>
          </Card>
        </section>

        <div className={`grid gap-6 ${agentSessionStarted ? 'xl:grid-cols-[420px_minmax(0,1fr)]' : ''}`}>
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
                  <div className="flex gap-2">
                    <Input
                      value={agentInput}
                      onChange={(e) => setAgentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !agentLoading) {
                          e.preventDefault()
                          askAgent()
                        }
                      }}
                      placeholder={`Message ${activeAgentName}...`}
                      className="bg-zinc-800 border-zinc-700"
                      disabled={!activeAgentId}
                    />
                    <Button onClick={askAgent} disabled={agentLoading || !agentInput.trim() || !activeAgentId}>
                      {agentLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
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
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Workspace</p>
              <h2 className="text-xl font-semibold tracking-tight">{activeTabTitle}</h2>
              <p className="text-sm text-zinc-400 mt-1">{activeTabHint}</p>
              {activeTab === 'overview' && nextStep && (
                <button
                  type="button"
                  onClick={() => setActiveTab(nextStep.tab)}
                  className="mt-2 text-xs text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                >
                  Next step: {nextStep.label}
                </button>
              )}
            </div>
            <div className="text-xs text-zinc-400">
              {isCalling ? 'Campaign currently running' : 'No active campaign'}
            </div>
          </div>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 xl:grid-cols-11 gap-2 h-auto bg-transparent p-0">
            <TabsTrigger value="overview" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="agents" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <Bot className="w-4 h-4 mr-2" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="call" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <Phone className="w-4 h-4 mr-2" />
              Call Center
            </TabsTrigger>
            <TabsTrigger value="sources" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <Download className="w-4 h-4 mr-2" />
              Sources
            </TabsTrigger>
            <TabsTrigger value="callers" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <Users className="w-4 h-4 mr-2" />
              Callers
            </TabsTrigger>
            <TabsTrigger value="recordings" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <Mic className="w-4 h-4 mr-2" />
              Recordings
            </TabsTrigger>
            <TabsTrigger value="leads" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <ClipboardList className="w-4 h-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="callbacks" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <CalendarClock className="w-4 h-4 mr-2" />
              Callbacks
            </TabsTrigger>
            <TabsTrigger value="history" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="billing" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <Wallet className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-semibold data-[state=active]:border-emerald-300">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    Start Here
                  </CardTitle>
                  <CardDescription>
                    Follow these steps in order.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    {startSteps.map((step, index) => (
                      <button
                        key={step.label}
                        type="button"
                        onClick={() => setActiveTab(step.tab)}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-left hover:border-zinc-700 transition"
                      >
                        <p className="text-xs text-zinc-500">Step {index + 1}</p>
                        <p className="text-sm text-zinc-200 mt-1">{step.label}</p>
                        <Badge className={`mt-2 ${step.done ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                          {step.done ? 'Done' : 'Pending'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-zinc-300">Readiness</p>
                      <p className="text-sm font-semibold text-emerald-400">{readinessScore}%</p>
                    </div>
                    <Progress value={readinessScore} className="h-2" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {readinessItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setActiveTab(item.tab)}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-left hover:border-zinc-700 transition"
                      >
                        <span className="text-sm text-zinc-200">{item.label}</span>
                        {item.ready ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Ready</Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Action Needed</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="secondary"
                    className="w-full justify-start bg-zinc-800 hover:bg-zinc-700"
                    onClick={() => setActiveTab('agents')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Agents
                  </Button>
                  <Button variant="secondary" className="w-full justify-start bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('callers')}>
                    <Users className="w-4 h-4 mr-2" />
                    Open Callers
                  </Button>
                  <Button variant="secondary" className="w-full justify-start bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('billing')}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Open Billing (Paid Checkout)
                  </Button>
                  <Button variant="secondary" className="w-full justify-start bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('callbacks')}>
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Open Callback Queue
                  </Button>
                  <Button className="w-full justify-start" onClick={() => setActiveTab('call')}>
                    <Phone className="w-4 h-4 mr-2" />
                    Open Call Center
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Conversion Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Connected Calls</span>
                    <span className="font-semibold">{connectedCalls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Completed Calls</span>
                    <span className="font-semibold">{totalCalls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Queued Numbers</span>
                    <span className="font-semibold">{totalNumbersQueued}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between text-sm">
                    <span className="text-zinc-400">Success Rate</span>
                    <span className="font-semibold text-emerald-400">{successRate}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Health</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentCampaign ? (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-300">{currentCampaign.name}</p>
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Status</span>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          {currentCampaign.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span>Progress</span>
                          <span>{stats.connected + stats.failed}/{stats.total}</span>
                        </div>
                        <Progress value={stats.total > 0 ? ((stats.connected + stats.failed) / stats.total) * 100 : 0} className="h-2" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">No active campaign. Use Call Center to launch one.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Billing Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Credits Available</span>
                    <span className="font-semibold text-emerald-400">{credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Managed Mode</span>
                    <span className="font-semibold">{managedMode ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Caller Numbers</span>
                    <span className="font-semibold">{callerNumbersActive}/{callerIdentities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Scheduled Callbacks</span>
                    <span className="font-semibold">{callbacksScheduled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Callbacks Due Now</span>
                    <span className="font-semibold text-amber-300">{callbacksDueNow}</span>
                  </div>
                  <Button variant="secondary" className="w-full bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('billing')}>
                    Open Billing (Paid)
                  </Button>
                  <Button variant="secondary" className="w-full bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('callbacks')}>
                    Open Callback Queue
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TimerReset className="w-5 h-5 text-emerald-400" />
                    Daily Operations Report
                  </CardTitle>
                  <CardDescription>
                    Today&apos;s call-center performance summary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <p className="text-xs text-zinc-500">Total Calls</p>
                      <p className="text-lg font-semibold">{dailyReport.totalCalls}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <p className="text-xs text-zinc-500">Connected</p>
                      <p className="text-lg font-semibold text-emerald-400">{dailyReport.connectedCalls}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <p className="text-xs text-zinc-500">Follow-ups Scheduled</p>
                      <p className="text-lg font-semibold">{dailyReport.followUpsScheduled}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <p className="text-xs text-zinc-500">Leads Touched</p>
                      <p className="text-lg font-semibold">{dailyReport.leadsTouched}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full bg-zinc-800 hover:bg-zinc-700"
                    onClick={() => setActiveTab('callbacks')}
                  >
                    Review Callback Queue
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Intelligence Cockpit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                    <div>
                      <p className="text-xs text-zinc-500">Workspace Health</p>
                      <p className="text-lg font-semibold text-zinc-100">{workspaceIntelligence.healthScore}%</p>
                    </div>
                    <Badge className={getIntelligenceStatusTone(workspaceIntelligence.status)}>
                      {workspaceIntelligence.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  <p className="text-sm text-zinc-300">{workspaceIntelligence.summary}</p>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Top Actions</p>
                    {workspaceIntelligence.nextActions.map(action => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setActiveTab(action.tab)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-left hover:border-zinc-700 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-zinc-100">{action.title}</p>
                          <Badge className={getPriorityTone(action.priority)}>{action.priority}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">{action.detail}</p>
                      </button>
                    ))}
                  </div>

                  {workspaceIntelligence.risks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Risks</p>
                      {workspaceIntelligence.risks.slice(0, 2).map((risk, index) => (
                        <p key={`${risk}-${index}`} className="text-xs text-red-200">• {risk}</p>
                      ))}
                    </div>
                  )}
                  {workspaceIntelligence.wins.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Wins</p>
                      {workspaceIntelligence.wins.slice(0, 2).map((win, index) => (
                        <p key={`${win}-${index}`} className="text-xs text-emerald-200">• {win}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
	          </TabsContent>

	          <TabsContent value="agents" className="space-y-6 animate-in fade-in-50 duration-200">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="w-5 h-5 text-emerald-400" />
                    Agent Memory
                  </CardTitle>
                  <CardDescription>
                    Every created agent has its own conversation history and workspace memory.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    {workspaceAgents.length === 0 ? (
                      <p className="text-sm text-zinc-500">No agents created yet. Create your first one below.</p>
                    ) : (
                      workspaceAgents.map(agent => {
                        const profile = agentProfiles.find(item => item.id === agent.profileId)
                        const historyCount = agentMessagesByAgent[agent.id]?.length || 0
                        const isActive = agent.id === activeAgentId
                        return (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => setActiveAgentId(agent.id)}
                            className={`w-full rounded-lg border p-3 text-left transition ${
                              isActive
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-zinc-200">{agent.name}</p>
                              <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700">{historyCount} messages</Badge>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                              {profile?.language || 'Language N/A'} • {profile?.expertise || 'General'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              Last updated {new Date(agent.updatedAt).toLocaleString()}
                            </p>
                          </button>
                        )
                      })
                    )}
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
                    <p className="text-sm font-medium text-zinc-200">Create New Agent</p>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {agentProfiles.map(profile => (
                        <div key={profile.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 space-y-2">
                          <p className="text-sm font-medium text-zinc-100">{profile.name}</p>
                          <p className="text-xs text-zinc-400">{profile.language} • {profile.style}</p>
                          <p className="text-xs text-zinc-500">{profile.expertise}</p>
                          <Input
                            value={newAgentDraftNames[profile.id] || ''}
                            onChange={e => setNewAgentDraftNames(prev => ({ ...prev, [profile.id]: e.target.value }))}
                            placeholder={`Name this ${profile.name} agent`}
                            className="bg-zinc-800 border-zinc-700"
                          />
                          <Button
                            type="button"
                            className="w-full"
                            onClick={() => startAgentSession(profile.id, newAgentDraftNames[profile.id] || '')}
                          >
                            Create and Start
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

	          {/* Call Center Tab */}
          <TabsContent value="call" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-zinc-300">
                  Steps: 1) add numbers, 2) assign a caller identity, 3) choose schedule, 4) start campaign.
                </p>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Smart Coaching</p>
                  <ul className="space-y-1 text-sm text-zinc-300">
                    {workspaceIntelligence.coachingTips.slice(0, 3).map((tip, index) => (
                      <li key={`${tip}-${index}`}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Numbers Input */}
	                <Card className="bg-zinc-900 border-zinc-800">
	                  <CardHeader>
	                    <CardTitle className="text-lg flex items-center gap-2">
	                      <Users className="w-5 h-5 text-emerald-400" />
	                      Phone Numbers
	                    </CardTitle>
	                    <CardDescription>
	                      Paste numbers or upload CSV, assign a caller identity, then choose when to launch.
	                    </CardDescription>
	                  </CardHeader>
	                  <CardContent>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,text/csv,.txt"
                      onChange={handleCsvImport}
                      className="hidden"
                    />
	                    <Textarea
	                      placeholder="+971 50 123 4567&#10;+971 55 987 6543&#10;+971 56 456 7890"
	                      value={numbers}
	                      onChange={(e) => setNumbers(e.target.value)}
	                      disabled={isCalling}
	                      className="min-h-[150px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
	                    />
	                    <div className="mt-4 grid gap-3 md:grid-cols-2">
	                      <div className="space-y-2">
	                        <Label>Assign Caller Identity</Label>
	                        <Select
	                          value={selectedCallerIdentityId || 'none'}
	                          onValueChange={(value) => {
	                            if (value === 'none') {
	                              setSelectedCallerIdentityId('')
	                              return
	                            }
	                            const identity = callerIdentities.find(item => item.id === value)
	                            if (identity) {
	                              applyIdentityToComposer(identity)
	                            }
	                          }}
	                          disabled={isCalling}
	                        >
	                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
	                            <SelectValue placeholder="Choose a caller identity" />
	                          </SelectTrigger>
	                          <SelectContent>
	                            <SelectItem value="none">No identity</SelectItem>
                            {callerIdentities.map(identity => (
                              <SelectItem key={identity.id} value={identity.id}>
                                {identity.name} ({identity.position}) - {identity.language} {identity.dedicatedNumber ? '• Number Active' : '• No Number'}
                              </SelectItem>
                            ))}
                          </SelectContent>
	                        </Select>
	                        <p className="text-xs text-zinc-500">
	                          No caller yet? Create one in the Callers tab.
	                        </p>
	                      </div>
	                      <div className="space-y-2">
	                        <Label>Schedule Calls (optional)</Label>
	                        <Input
	                          type="datetime-local"
	                          value={scheduledAt}
	                          onChange={(e) => setScheduledAt(e.target.value)}
	                          disabled={isCalling}
	                          className="bg-zinc-800 border-zinc-700"
	                        />
	                        <p className="text-xs text-zinc-500">Leave empty to start immediately. Scheduled campaigns auto-start when due.</p>
	                      </div>
	                    </div>
	                    <div className="mt-3 space-y-2">
	                      <Label>Lead Notes (optional)</Label>
	                      <Textarea
	                        placeholder={"+971501234567 | user said interested in villa | target: qualify budget + timeline\n+971559876543 | asked for weekend callback | target: book appointment"}
	                        value={leadNotesText}
	                        onChange={(e) => setLeadNotesText(e.target.value)}
	                        disabled={isCalling}
	                        className="min-h-[92px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
	                      />
	                      <p className="text-xs text-zinc-500">
	                        Format per line: <code>number | user comment | target comment</code>. These comments attach to each call result.
	                      </p>
	                    </div>
	                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
	                      <span>{extractNumbers(numbers).length} numbers</span>
	                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => csvInputRef.current?.click()}
                        disabled={isCalling}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Voice & Target Blueprint */}
                <Card className="bg-zinc-900 border-zinc-800">
	                  <CardHeader>
	                    <CardTitle className="text-lg flex items-center gap-2">
	                      <Volume2 className="w-5 h-5 text-emerald-400" />
	                      Voice & Target Blueprint
	                    </CardTitle>
	                  </CardHeader>
	                  <CardContent className="space-y-4">
	                    <div className="space-y-2">
	                      <Label>Select Voice</Label>
	                      <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isCalling}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map(voice => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name} ({voice.labels?.gender || 'N/A'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={isCalling}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Campaign Target Blueprint</Label>
                      <Textarea
                        placeholder={"Goal: qualify lead and transfer\nAudience: investors in Dubai\nOffer: off-plan launch with payment plan\nQualification: budget, timeline, decision maker\nCTA: connect now with specialist"}
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        disabled={isCalling}
                        className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                      {selectedCallerIdentity && (
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-500">
                            Active profile: {selectedCallerIdentity.name} ({selectedCallerIdentity.position}) • Industry: {selectedCallerIdentity.industry || settings.industry || 'General'}
                          </p>
                          {managedMode && !selectedCallerIdentity.dedicatedNumber && (
                            <p className="text-xs text-amber-300">
                              This caller needs a dedicated number before calls can start.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Recording Options */}
	                    <div className="flex items-center gap-6 pt-2">
	                      <div className="flex items-center gap-2">
	                        <Switch
                          checked={settings.recordCalls}
                          onCheckedChange={(checked) => setSettings({ ...settings, recordCalls: checked })}
                          disabled={isCalling}
                        />
                        <Label className="text-sm text-zinc-400">Record calls</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={settings.transcribeCalls}
                          onCheckedChange={(checked) => setSettings({ ...settings, transcribeCalls: checked })}
                          disabled={isCalling}
                        />
	                        <Label className="text-sm text-zinc-400">Transcribe</Label>
	                      </div>
	                    </div>
	                  </CardContent>
	                </Card>

                {/* Action Buttons */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="w-5 h-5 text-emerald-400" />
                      AI Target Copilot
                    </CardTitle>
                    <CardDescription>
                      Generate and refine a target blueprint with discovery and objection handling.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-3">
                      {copilotMessages.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                          Ask for target setup, smart discovery questions, and objection handling lines.
                        </p>
                      ) : (
                        copilotMessages.map((msg, idx) => (
                          <div key={idx} className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-zinc-800/80' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                            <p className="text-xs uppercase tracking-wide text-zinc-400 mb-1">{msg.role === 'user' ? 'You' : 'Copilot'}</p>
                            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
                            {msg.script && (
                              <div className="mt-3 p-3 rounded-md bg-zinc-900 border border-zinc-700 space-y-2">
                                <p className="text-xs text-zinc-400">Suggested Target Blueprint</p>
                                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.script}</p>
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() => {
                                    setScript(msg.script || '')
                                    toast.success('Target blueprint applied')
                                  }}
                                >
                                  Use This Target
                                </Button>
                              </div>
                            )}
                            {msg.objections && msg.objections.length > 0 && (
                              <ul className="mt-2 text-xs text-zinc-300 space-y-1">
                                {msg.objections.map((item, objectionIdx) => (
                                  <li key={objectionIdx}>• {item}</li>
                                ))}
                              </ul>
                            )}
                            {msg.discoveryQuestions && msg.discoveryQuestions.length > 0 && (
                              <ul className="mt-2 text-xs text-emerald-200 space-y-1">
                                {msg.discoveryQuestions.map((item, qIdx) => (
                                  <li key={qIdx}>Q: {item}</li>
                                ))}
                              </ul>
                            )}
                            {msg.conversationMoves && msg.conversationMoves.length > 0 && (
                              <ul className="mt-2 text-xs text-blue-200 space-y-1">
                                {msg.conversationMoves.map((item, moveIdx) => (
                                  <li key={moveIdx}>Move: {item}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={copilotInput}
                        onChange={(e) => setCopilotInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !copilotLoading) {
                            e.preventDefault()
                            askCopilot()
                          }
                        }}
                        placeholder="Example: Build a target for investors in Dubai with qualification questions"
                        className="bg-zinc-800 border-zinc-700"
                      />
                      <Button onClick={askCopilot} disabled={copilotLoading || !copilotInput.trim()}>
                        {copilotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {!isCalling ? (
	                    <Button 
	                      onClick={startCalling}
	                      disabled={loading || !isConfigured || (managedMode && !!selectedCallerIdentityId && !selectedCallerIdentity?.dedicatedNumber)}
	                      className="flex-1 h-14 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
	                    >
	                      <Play className="w-5 h-5 mr-2" />
	                      {scheduledAt ? 'Schedule Campaign' : 'Start Calling'}
	                    </Button>
                  ) : (
                    <Button 
                      onClick={stopCalling}
                      variant="destructive"
                      className="flex-1 h-14 text-lg"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop Campaign
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Column - Status */}
              <div className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800">
	                  <CardHeader>
	                    <CardTitle className="text-lg flex items-center gap-2">
	                      {isCalling ? (
	                        <span className="relative flex h-3 w-3">
	                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
	                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
	                        </span>
	                      ) : (
	                        <Clock className="w-5 h-5 text-zinc-400" />
	                      )}
	                      {isCalling ? 'Calling...' : currentCampaign?.status === 'scheduled' ? 'Scheduled Campaign' : 'Status'}
	                    </CardTitle>
	                  </CardHeader>
	                  <CardContent className="space-y-4">
	                    {currentCampaign ? (
	                      currentCampaign.status === 'scheduled' ? (
	                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
	                          <p className="text-sm text-amber-200">Campaign is queued and will start automatically.</p>
	                          <p className="text-xs text-zinc-300">
	                            Scheduled for {new Date(currentCampaign.scheduledAt || currentCampaign.createdAt).toLocaleString()}
	                          </p>
	                          <p className="text-xs text-zinc-400">
	                            {currentCampaign.numbers?.length || 0} numbers assigned
	                          </p>
	                        </div>
	                      ) : (
	                        <>
	                          <div className="space-y-2">
	                            <div className="flex justify-between text-sm">
	                              <span className="text-zinc-400">Progress</span>
	                              <span>{stats.connected + stats.failed} / {stats.total}</span>
	                            </div>
	                            <Progress value={stats.total > 0 ? ((stats.connected + stats.failed) / stats.total) * 100 : 0} className="h-2" />
	                          </div>
	                          
	                          <div className="grid grid-cols-2 gap-3">
	                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
	                              <div className="text-2xl font-bold text-emerald-400">{stats.connected}</div>
	                              <div className="text-xs text-zinc-400">Connected</div>
	                            </div>
	                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
	                              <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
	                              <div className="text-xs text-zinc-400">Failed</div>
	                            </div>
	                          </div>
	                        </>
	                      )
	                    ) : (
	                      <div className="text-center py-8 text-zinc-500">
	                        <PhoneOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
	                        <p>No active campaign</p>
	                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Total Calls</span>
                        <span className="font-bold">{campaigns.reduce((sum, c) => sum + (c.results?.length || 0), 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Campaigns</span>
                        <span className="font-bold">{campaigns.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Recordings</span>
                        <span className="font-bold text-emerald-400">{recordings.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Credits Left</span>
                        <span className="font-bold text-emerald-400">{credits}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
	            </div>
	          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-400" />
                    Zapier + Facebook Lead Forms
                  </CardTitle>
                  <CardDescription>
                    Use this webhook in Zapier. Facebook Lead Ads should send each new lead to this URL.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">Enable webhook imports</p>
                      <p className="text-xs text-zinc-400 mt-1">When enabled, incoming payloads are stored in Lead Inbox.</p>
                    </div>
                    <Switch
                      checked={leadSourceSettings.zapierEnabled}
                      onCheckedChange={checked => setLeadSourceSettings(prev => ({ ...prev, zapierEnabled: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={leadSourceSettings.zapierWebhookUrl}
                      readOnly
                      className="bg-zinc-800 border-zinc-700 text-zinc-200"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700" onClick={copyWebhookUrl}>
                        <Upload className="w-4 h-4 mr-2" />
                        Copy Webhook URL
                      </Button>
                      <Button type="button" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700" onClick={rotateZapierWebhookKey} disabled={savingLeadSources}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Rotate Key
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-400 space-y-1">
                    <p>Zapier trigger examples: Facebook Lead Ads, Typeform, Webflow forms, Google Sheets.</p>
                    <p>Action: Webhooks by Zapier - POST with lead fields including phone number.</p>
                  </div>

                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Recommended Zapier Fields</p>
                    <div className="grid gap-2 md:grid-cols-2 text-xs text-zinc-300">
                      <p><span className="text-zinc-500">phone</span>: lead phone number</p>
                      <p><span className="text-zinc-500">name</span>: full name</p>
                      <p><span className="text-zinc-500">email</span>: lead email (optional)</p>
                      <p><span className="text-zinc-500">source</span>: facebook_lead_ads (optional)</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Arrays and Facebook webhook payloads are supported. Phone number is required.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Lead Inbox</CardTitle>
                  <CardDescription>
                    Pull imported leads into your Call Center composer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <p className="text-xs text-zinc-500">New</p>
                      <p className="text-xl font-semibold text-emerald-300">{leadSourceSettings.inboxNewCount}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                      <p className="text-xs text-zinc-500">Consumed</p>
                      <p className="text-xl font-semibold text-zinc-200">{leadSourceSettings.inboxConsumedCount}</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={pullLeadInboxToComposer}
                    disabled={loadingLeadInbox || leadSourceSettings.inboxNewCount === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {loadingLeadInbox ? 'Loading Inbox...' : 'Load Leads Into Call Center'}
                  </Button>

                  <p className="text-xs text-zinc-500">
                    This appends imported numbers and lead notes directly to your current campaign draft.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400" />
                    Google Drive CSV Sync
                  </CardTitle>
                  <CardDescription>
                    Paste a public Google Sheet or Drive CSV URL and import leads to inbox.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">Enable Google Drive source</p>
                      <p className="text-xs text-zinc-400 mt-1">Keep this on if your team is syncing from Drive.</p>
                    </div>
                    <Switch
                      checked={leadSourceSettings.googleDriveEnabled}
                      onCheckedChange={checked => setLeadSourceSettings(prev => ({ ...prev, googleDriveEnabled: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Google Drive / Sheet URL</Label>
                    <Input
                      value={leadSourceSettings.googleDriveCsvUrl}
                      onChange={e => setLeadSourceSettings(prev => ({ ...prev, googleDriveCsvUrl: e.target.value }))}
                      placeholder="https://docs.google.com/spreadsheets/d/... or CSV link"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700" onClick={saveLeadSourcesConfig} disabled={savingLeadSources}>
                      <Settings className="w-4 h-4 mr-2" />
                      {savingLeadSources ? 'Saving...' : 'Save Source Settings'}
                    </Button>
                    <Button type="button" onClick={syncGoogleDriveLeads} disabled={syncingGoogleDrive}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {syncingGoogleDrive ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Source Settings</CardTitle>
                  <CardDescription>Save integration toggles and webhook status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                    <span className="text-sm text-zinc-300">Zapier webhook</span>
                    <Badge className={leadSourceSettings.zapierEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-700 text-zinc-200 border-zinc-600'}>
                      {leadSourceSettings.zapierEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                    <span className="text-sm text-zinc-300">Google Drive source</span>
                    <Badge className={leadSourceSettings.googleDriveEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-zinc-700 text-zinc-200 border-zinc-600'}>
                      {leadSourceSettings.googleDriveEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <Button type="button" className="w-full" onClick={saveLeadSourcesConfig} disabled={savingLeadSources}>
                    {savingLeadSources ? 'Saving...' : 'Save All'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-lg">Integration Activity</CardTitle>
                <CardDescription>Latest source events, imports, and sync results.</CardDescription>
              </CardHeader>
              <CardContent>
                {integrationEvents.length === 0 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-500">
                    No activity yet. Send a lead from Zapier or run Google Drive sync.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {integrationEvents.slice(0, 12).map(event => (
                      <div key={event.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-zinc-100">{event.message}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {event.source} • {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getIntegrationStatusTone(event.status)}>
                            {event.status}
                          </Badge>
                          <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700">
                            +{event.importedCount}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

	          {/* Callers Tab */}
	          <TabsContent value="callers" className="space-y-6 animate-in fade-in-50 duration-200">
	            {callerIdentityManager}
	          </TabsContent>

	          {/* Recordings Tab */}
	          <TabsContent value="recordings" className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recordings List */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                      <Input
                        value={recordingSearch}
                        onChange={(e) => setRecordingSearch(e.target.value)}
                        placeholder="Search by number, keyword, summary..."
                        className="bg-zinc-800 border-zinc-700"
                      />
                      <Button
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700"
                        onClick={fetchRecordings}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {recordings.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 text-center text-zinc-500">
                      <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No recordings yet</p>
                      <p className="text-sm mt-2">Enable recording in settings to capture calls</p>
                    </CardContent>
                  </Card>
                ) : filteredRecordings.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 text-center text-zinc-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No recordings match your search</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRecordings.map((recording) => (
                    <Card
                      key={recording.id}
                      className={`bg-zinc-900 border-zinc-800 ${selectedRecording?.id === recording.id ? 'ring-1 ring-emerald-500/40' : ''}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSelectedRecording(recording)}
                            className="flex items-center gap-3 text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <Mic className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{recording.phoneNumber}</CardTitle>
                              <p className="text-xs text-zinc-400">
                                {new Date(recording.createdAt).toLocaleString()} • {recording.duration}s
                              </p>
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playRecording(recording.recordingUrl, recording.id)}
                              className="text-emerald-400 hover:text-emerald-300"
                            >
                              {playingRecording === recording.id ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => transcribeRecording(recording.id)}
                              disabled={transcribing === recording.id || !!recording.transcript}
                              className="text-zinc-400 hover:text-white"
                            >
                              {transcribing === recording.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-zinc-400 hover:text-white"
                            >
                              <a href={recording.recordingUrl} download>
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {recording.transcript && (
                        <CardContent className="pt-0">
                          {/* Summary */}
                          {recording.transcript.summary && (
                            <div className="mb-3 p-3 rounded-lg bg-zinc-800/50">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-medium">Summary</span>
                                {recording.transcript.sentiment && (
                                  <Badge className={`ml-auto ${getSentimentColor(recording.transcript.sentiment)}`}>
                                    {recording.transcript.sentiment}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-zinc-300">{recording.transcript.summary}</p>
                            </div>
                          )}
                          
                          {/* Keywords */}
                          {recording.transcript.keywords && recording.transcript.keywords.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {recording.transcript.keywords.map((keyword, i) => (
                                <Badge key={i} variant="outline" className="border-zinc-700 text-zinc-400">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Action Items */}
                          {recording.transcript.actionItems && recording.transcript.actionItems.length > 0 && (
                            <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-medium text-amber-400">Action Items</span>
                              </div>
                              <ul className="text-sm text-zinc-300 space-y-1">
                                {recording.transcript.actionItems.map((item, i) => (
                                  <li key={i}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Full Transcript */}
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white">
                              View full transcript
                            </summary>
                            <div className="mt-2 p-3 rounded-lg bg-zinc-800 text-sm text-zinc-300 max-h-60 overflow-y-auto">
                              {recording.transcript.text}
                            </div>
                          </details>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
              
              {/* Stats Sidebar */}
              <div className="space-y-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Recording Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Total Recordings</span>
                        <span className="font-bold">{filteredRecordings.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Transcribed</span>
                        <span className="font-bold text-emerald-400">
                          {recordings.filter(r => r.transcript).length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Total Duration</span>
                        <span className="font-bold">
                          {Math.round(recordings.reduce((sum, r) => sum + (r.duration || 0), 0) / 60)}m
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Recording</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedRecording ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Phone</span>
                          <span className="font-medium">{selectedRecording.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Duration</span>
                          <span className="font-medium">{selectedRecording.duration}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Sentiment</span>
                          <Badge className={getSentimentColor(selectedRecording.transcript?.sentiment)}>
                            {selectedRecording.transcript?.sentiment || 'unknown'}
                          </Badge>
                        </div>
                        <p className="text-zinc-300 text-xs leading-relaxed">
                          {selectedRecording.transcript?.summary || 'No summary available yet. Run transcription to generate insights.'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400">Select a recording to view details.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <Input
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search lead by phone, comments, or summary..."
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="bg-zinc-800 hover:bg-zinc-700"
                      onClick={fetchCampaigns}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-zinc-800 hover:bg-zinc-700"
                      onClick={() => setActiveTab('callbacks')}
                    >
                      Open Callback Queue
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredLeads.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center text-zinc-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No lead intelligence available yet</p>
                  <p className="text-sm mt-2">Start campaigns to build lead timelines and performance data.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredLeads.slice(0, 80).map((lead: LeadProfile) => (
                  <Card key={lead.phoneNumber} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-medium">{lead.phoneNumber}</p>
                          <p className="text-xs text-zinc-500">
                            First seen: {formatDateTime(lead.firstSeenAt)} • Last activity: {formatDateTime(lead.lastActivityAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700">Calls {lead.totalCalls}</Badge>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Connected {lead.connectedCalls}</Badge>
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">No Answer {lead.noAnswerCalls}</Badge>
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Failed {lead.failedCalls}</Badge>
                        </div>
                      </div>

                      {(lead.latestUserComment || lead.latestTargetComment || lead.latestCallComment || lead.latestLeadSummary) && (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-300 space-y-1">
                          {lead.latestUserComment && <p>User note: {lead.latestUserComment}</p>}
                          {lead.latestTargetComment && <p>Target note: {lead.latestTargetComment}</p>}
                          {lead.latestCallComment && <p>Call feedback: {lead.latestCallComment}</p>}
                          {lead.latestLeadSummary && <p>Lead summary: {lead.latestLeadSummary}</p>}
                        </div>
                      )}

                      <details className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                        <summary className="cursor-pointer text-sm text-zinc-300">
                          Timeline ({lead.timeline.length} events)
                        </summary>
                        <div className="mt-3 space-y-2">
                          {lead.timeline.slice(0, 12).map((item, index) => (
                            <div key={`${item.campaignId}-${item.timestamp}-${index}`} className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-xs text-zinc-300">
                              <p className="text-zinc-200">
                                {item.campaignName} • {item.status} • {formatDateTime(item.timestamp)}
                              </p>
                              {item.callComment && <p className="text-zinc-400 mt-1">Feedback: {item.callComment}</p>}
                              {item.leadSummary && <p className="text-zinc-400 mt-1">Lead: {item.leadSummary}</p>}
                              {item.followUpAt && (
                                <p className="text-amber-300 mt-1">
                                  Callback: {formatDateTime(item.followUpAt)} ({item.followUpStatus || 'scheduled'})
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Callback Queue Tab */}
          <TabsContent value="callbacks" className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-emerald-400" />
                    Callback Queue
                  </CardTitle>
                  <CardDescription>
                    Auto-scheduled follow-up tasks generated from live conversations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <Select value={callbackFilter} onValueChange={(value) => setCallbackFilter(value as typeof callbackFilter)}>
                      <SelectTrigger className="w-full sm:w-56 bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700"
                        onClick={loadScheduledCallbacksToComposer}
                      >
                        Load Scheduled to Call Center
                      </Button>
                      <Button
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700"
                        onClick={fetchCampaigns}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {filteredCallbacks.length === 0 ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 py-12 text-center text-zinc-500">
                      <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No callback tasks for this filter</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCallbacks.map((task: CallbackTask, index: number) => {
                        const followUpCampaign = task.followUpCampaignId
                          ? campaigns.find(campaign => campaign.id === task.followUpCampaignId)
                          : null
                        return (
                          <div key={`${task.phoneNumber}-${task.callbackAt}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">{task.phoneNumber}</p>
                                <p className="text-xs text-zinc-500">
                                  {task.parentCampaignName} • callback at {formatDateTime(task.callbackAt)}
                                </p>
                              </div>
                              <Badge
                                className={
                                  task.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : task.status === 'cancelled'
                                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }
                              >
                                {task.status}
                              </Badge>
                            </div>
                            {(task.reason || task.targetComment || task.userComment || task.callComment) && (
                              <div className="mt-2 text-xs text-zinc-300 space-y-1">
                                {task.reason && <p>Reason: {task.reason}</p>}
                                {task.targetComment && <p>Target note: {task.targetComment}</p>}
                                {task.userComment && <p>User note: {task.userComment}</p>}
                                {task.callComment && <p>Call feedback: {task.callComment}</p>}
                              </div>
                            )}
                            {followUpCampaign && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="mt-2 bg-zinc-800 hover:bg-zinc-700"
                                onClick={() => loadCampaignToComposer(followUpCampaign)}
                              >
                                Open Follow-up Campaign
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-lg">Queue Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Scheduled</span>
                    <span className="font-semibold">{callbacksScheduled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Due Now</span>
                    <span className="font-semibold text-amber-300">{callbacksDueNow}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Completed Today</span>
                    <span className="font-semibold text-emerald-400">{dailyReport.followUpsCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cancelled Today</span>
                    <span className="font-semibold text-red-300">{dailyReport.followUpsCancelled}</span>
                  </div>
                  <Button className="w-full" onClick={() => setActiveTab('call')}>
                    Open Call Center
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6 animate-in fade-in-50 duration-200">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle>Campaign History</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No campaigns yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div 
                        key={campaign.id} 
                        className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{campaign.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={campaign.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                            >
                              {campaign.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-zinc-700 hover:bg-zinc-600"
                              onClick={() => loadCampaignToComposer(campaign)}
                            >
                              Reuse Setup
                            </Button>
                          </div>
                        </div>
	                        <div className="flex gap-4 text-sm text-zinc-400">
	                          <span>{campaign.numbers?.length || 0} numbers</span>
	                          <span>{campaign.results?.length || 0} called</span>
	                          <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
	                          {campaign.status === 'scheduled' && campaign.scheduledAt && (
	                            <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}</span>
	                          )}
	                        </div>
                          {(campaign.results || []).length > 0 && (
                            <div className="mt-3 space-y-2">
                              {(campaign.results || []).slice(0, 6).map((result) => (
                                <div key={result.id} className="rounded-md border border-zinc-700 bg-zinc-900/60 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm text-zinc-200">{result.phoneNumber}</p>
                                    <Badge className="bg-zinc-700 text-zinc-200 border-zinc-600">{result.status}</Badge>
                                  </div>
                                  {result.userComment && (
                                    <p className="text-xs text-zinc-300 mt-1">User note: {result.userComment}</p>
                                  )}
                                  {result.targetComment && (
                                    <p className="text-xs text-zinc-400 mt-1">Target note: {result.targetComment}</p>
                                  )}
                                  {result.callComment && (
                                    <p className="text-xs text-emerald-300 mt-1">Call feedback: {result.callComment}</p>
                                  )}
                                  {result.leadSummary && (
                                    <p className="text-xs text-zinc-400 mt-1">Lead said: {result.leadSummary}</p>
                                  )}
                                  {result.followUpRequested && result.followUpAt && (
                                    <p className="text-xs text-amber-300 mt-1">
                                      Callback scheduled: {new Date(result.followUpAt).toLocaleString()} ({result.followUpStatus || 'scheduled'})
                                    </p>
                                  )}
                                </div>
                              ))}
                              {(campaign.results || []).length > 6 && (
                                <p className="text-xs text-zinc-500">Showing 6 of {campaign.results.length} call outcomes</p>
                              )}
                            </div>
                          )}
	                      </div>
	                    ))}
	                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6 animate-in fade-in-50 duration-200">
            {!managedMode ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    Managed Billing Is Disabled
                  </CardTitle>
                  <CardDescription>
                    Enable managed mode to sell phone numbers and credits without requiring customer API keys.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-zinc-300">
                    Once enabled, this tab handles all PayPal checkout flows for number activation and credit top-ups.
                  </p>
                  <Button onClick={() => setActiveTab('settings')}>
                    Open Settings
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 xl:grid-cols-3">
                <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                      Billing & Recharge
                    </CardTitle>
                    <CardDescription>
                      All purchases are paid in PayPal checkout.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-3">
                        <p className="text-sm font-semibold">Caller Number Activation</p>
                        <p className="text-xs text-zinc-400">
                          Each caller identity needs one dedicated number.
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2">
                            <p className="text-zinc-400 text-xs">Caller Identities</p>
                            <p className="font-semibold">{callerIdentities.length}</p>
                          </div>
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2">
                            <p className="text-zinc-400 text-xs">Numbers Active</p>
                            <p className="font-semibold text-emerald-400">{callerNumbersActive}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setActiveTab('callers')}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Open Callers
                        </Button>
                      </div>

                      <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-3">
                        <p className="text-sm font-semibold">Credit Balance</p>
                        <p className="text-3xl font-bold text-emerald-400">{credits}</p>
                        <p className="text-xs text-zinc-500">One credit is consumed per outbound call attempt.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Recharge Credits (Paid)</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {creditProducts.map((product, index) => (
                          <button
                            key={product.id}
                            type="button"
                            disabled={purchasingProduct !== null}
                            onClick={() => purchaseProduct(product.id)}
                            className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 text-left hover:border-emerald-500/40 transition disabled:opacity-50"
                          >
                            <p className="text-lg font-semibold">{(product.credits || 0).toLocaleString()} Credits</p>
                            <p className="text-sm text-zinc-400">${product.price.toFixed(2)}</p>
                            <p className="text-xs text-zinc-500 mt-2">
                              {index === 0 ? 'Starter calls' : index === creditProducts.length - 1 ? 'High-volume usage' : 'Growth usage'}
                            </p>
                            <p className="text-xs text-emerald-300 mt-2">Buy now with PayPal</p>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-500">You are charged in PayPal checkout. Credits are applied automatically after successful payment.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Plan Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Billing Provider</span>
                      <span className="font-semibold">PayPal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Caller Identities</span>
                      <span className="font-semibold">{callerIdentities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Numbers Active</span>
                      <span className="font-semibold">{callerNumbersActive}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Current Credits</span>
                      <span className="font-semibold text-emerald-400">{credits}</span>
                    </div>
                    <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                      Buy caller numbers from the Callers tab, then assign numbers to campaigns in Call Center.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

	          {/* Settings Tab */}
	          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-200" id="settings">
	            <Card className="bg-zinc-900 border-zinc-800">
	              <CardHeader>
	                <CardTitle className="flex items-center gap-2">
	                  <Settings className="w-5 h-5 text-emerald-400" />
	                  Account Settings
	                </CardTitle>
	                <CardDescription>
	                  Manage account profile, forwarding, call behavior, and team members.
	                </CardDescription>
	              </CardHeader>
	              <CardContent className="space-y-6">
	                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
	                  <p className="text-sm text-emerald-300 font-medium">Platform-Managed Integrations</p>
	                  <p className="text-xs text-zinc-300 mt-1">
	                    Voice, telephony, and AI provider keys are managed by the platform. Users only configure account and campaign settings.
	                  </p>
	                </div>

                {/* Business Profile */}
                <div className="space-y-4">
                  <h3 className="font-medium text-emerald-400">Business Profile</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input
                        placeholder="Your company name"
                        value={settings.businessName || ''}
                        onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input
                        placeholder="Real Estate, Insurance, Med Spa..."
                        value={settings.industry || ''}
                        onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Company Details</Label>
                    <Textarea
                      placeholder="Short company profile, value proposition, and offer context."
                      value={settings.companyDetails || ''}
                      onChange={(e) => setSettings({ ...settings, companyDetails: e.target.value })}
                      className="min-h-[88px] bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Global "Say This" Rules</Label>
                      <Textarea
                        placeholder="Must mention launch date, financing option, call-back line..."
                        value={settings.sayThisRules || ''}
                        onChange={(e) => setSettings({ ...settings, sayThisRules: e.target.value })}
                        className="min-h-[88px] bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Global "Avoid This" Rules</Label>
                      <Textarea
                        placeholder="Avoid guaranteed return claims, legal wording, price commitments..."
                        value={settings.avoidThisRules || ''}
                        onChange={(e) => setSettings({ ...settings, avoidThisRules: e.target.value })}
                        className="min-h-[88px] bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Forward Number */}
                <div className="space-y-4">
                  <h3 className="font-medium text-emerald-400">Call Forwarding</h3>
                  <div className="space-y-2">
                    <Label>Your Phone Number (for forwarding)</Label>
                    <Input
                      placeholder="+971 50 123 4567"
                      value={settings.forwardToNumber}
                      onChange={(e) => setSettings({ ...settings, forwardToNumber: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <p className="text-xs text-zinc-500">When a prospect answers, the call will be forwarded to this number</p>
                  </div>
                </div>

                {/* Recording Options */}
                <div className="space-y-4">
                  <h3 className="font-medium text-emerald-400">Recording & Transcription</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings.recordCalls}
                        onCheckedChange={(checked) => setSettings({ ...settings, recordCalls: checked })}
                      />
                      <Label className="text-zinc-400">Record all calls</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings.transcribeCalls}
                        onCheckedChange={(checked) => setSettings({ ...settings, transcribeCalls: checked })}
                      />
                      <Label className="text-zinc-400">Auto-transcribe</Label>
                    </div>
                  </div>
                </div>

	                <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
	                  <div>
	                    <p className="text-sm font-medium text-zinc-200">Caller identities are managed in a dedicated workspace tab.</p>
	                    <p className="text-xs text-zinc-400">Create, edit, preview voice, and track KPI performance per caller identity.</p>
	                  </div>
	                  <Button variant="secondary" className="bg-zinc-700 hover:bg-zinc-600" onClick={() => setActiveTab('callers')}>
	                    Open Callers Tab
	                  </Button>
	                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-emerald-400">Team Accounts</h3>
                  <p className="text-xs text-zinc-500">
                    Add your internal operators (agent, manager, QA) so account ownership is documented before full RBAC rollout.
                  </p>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Input
                      placeholder="Name"
                      value={teamForm.name}
                      onChange={e => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <Input
                      placeholder="Email"
                      value={teamForm.email}
                      onChange={e => setTeamForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <Input
                      placeholder="Role (Agent, Manager...)"
                      value={teamForm.role}
                      onChange={e => setTeamForm(prev => ({ ...prev, role: e.target.value }))}
                      className="bg-zinc-800 border-zinc-700"
                    />
                    <Button
                      type="button"
                      onClick={addTeamMember}
                      disabled={teamLoading}
                      className="bg-zinc-700 hover:bg-zinc-600"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {teamMembers.length === 0 ? (
                      <p className="text-sm text-zinc-500">No team members added yet.</p>
                    ) : (
                      teamMembers.map(member => (
                        <div key={member.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{member.name} <span className="text-zinc-500">({member.role})</span></p>
                            <p className="text-xs text-zinc-400">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="bg-zinc-800 hover:bg-zinc-700"
                              onClick={() => toggleTeamMember(member)}
                              disabled={teamLoading}
                            >
                              {member.active ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-red-300 hover:text-red-200"
                              onClick={() => removeTeamMember(member.id)}
                              disabled={teamLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

	                {managedMode && (
	                  <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Billing is now managed in a dedicated workspace tab.</p>
                      <p className="text-xs text-zinc-400">Use the Billing tab for PayPal checkout, number activation, and top-ups.</p>
                    </div>
                    <Button variant="secondary" className="bg-zinc-700 hover:bg-zinc-600" onClick={() => setActiveTab('billing')}>
                      Open Billing Tab
                    </Button>
	                  </div>
	                )}

	                <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
	                  <div>
	                    <p className="text-sm font-medium text-zinc-200">Need setup guidance?</p>
	                    <p className="text-xs text-zinc-400">Open Docs and FAQ for deployment, billing, and campaign operations.</p>
	                  </div>
	                  <div className="flex items-center gap-2">
	                    <Button variant="secondary" asChild className="bg-zinc-700 hover:bg-zinc-600">
	                      <Link href="/docs">Docs</Link>
	                    </Button>
	                    <Button variant="secondary" asChild className="bg-zinc-700 hover:bg-zinc-600">
	                      <Link href="/faq">FAQ</Link>
	                    </Button>
	                  </div>
	                </div>

	                <Button 
	                  onClick={saveSettings}
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
