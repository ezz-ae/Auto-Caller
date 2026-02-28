'use client'

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react'
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
  Target
} from 'lucide-react'
import { toast } from 'sonner'

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
}

interface Voice {
  id: string
  name: string
  category: string
  labels: Record<string, string>
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
}

interface Campaign {
  id: string
  name: string
  status: string
  numbers: string[]
  results: CallResult[]
  createdAt: string
  script?: string
  voiceId?: string
}

interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
  script?: string
  objections?: string[]
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
  })
  const [credits, setCredits] = useState(0)
  const [isConfigured, setIsConfigured] = useState(false)
  const [managedMode, setManagedMode] = useState(false)
  const [assignedPhoneNumber, setAssignedPhoneNumber] = useState('')
  
  // Call state
  const [numbers, setNumbers] = useState('')
  const [script, setScript] = useState('Hi, this is a call about an exciting property opportunity in your area. I\'d love to share more details with you. Are you available to talk?')
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM')
  const [voices, setVoices] = useState<Voice[]>([])
  
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
  const csvInputRef = useRef<HTMLInputElement>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [purchasingProduct, setPurchasingProduct] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([])
  const [copilotInput, setCopilotInput] = useState('')
  const [copilotLoading, setCopilotLoading] = useState(false)
  const initRef = useRef(false)

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/calls')
      const data = await res.json()
      const loadedCampaigns = data.campaigns || []
      setCampaigns(loadedCampaigns)

      const active = loadedCampaigns.find((c: Campaign) => c.status === 'running')
      setCurrentCampaign(active || null)
      setIsCalling(!!active)
    } catch {
      console.error('Failed to load campaigns')
    }
  }, [])

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch('/api/recordings')
      const data = await res.json()
      setRecordings(data.recordings || [])
    } catch {
      console.error('Failed to load recordings')
    }
  }, [])

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl
    }
  }, [redirectUrl])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    
    const init = async () => {
      // Fetch settings
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        setSettings(data.settings)
        setCredits(data.credits)
        setIsConfigured(data.isConfigured)
        setManagedMode(!!data.settings?.managedMode)
        setAssignedPhoneNumber(data.settings?.assignedPhoneNumber || '')
      } catch {
        toast.error('Failed to load settings')
      }
      
      // Fetch voices
      try {
        const res = await fetch('/api/voices')
        const data = await res.json()
        setVoices(data.voices || [])
      } catch {
        setVoices([
          { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'premade', labels: { gender: 'female' } },
          { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', category: 'premade', labels: { gender: 'female' } },
          { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade', labels: { gender: 'male' } },
          { id: 'TxGEqnHWrfWFT1GWmBXj', name: 'Josh', category: 'premade', labels: { gender: 'male' } },
        ])
      }
      
      await Promise.all([fetchCampaigns(), fetchRecordings()])
    }
    
    init()
  }, [fetchCampaigns, fetchRecordings])

  useEffect(() => {
    if (!isCalling) return

    const interval = setInterval(() => {
      fetchCampaigns()
      if (activeTab === 'recordings' || activeTab === 'overview') {
        fetchRecordings()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [activeTab, fetchCampaigns, fetchRecordings, isCalling])

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
        setAssignedPhoneNumber(settings.assignedPhoneNumber || assignedPhoneNumber)
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    }
    setLoading(false)
  }

  const purchaseProduct = async (productId: string, price: number, creditsAmount = 0) => {
    setPurchasingProduct(productId)
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          price,
          credits: creditsAmount,
        }),
      })

      const data = await res.json()

      if (data.approvalUrl) {
        setRedirectUrl(data.approvalUrl)
      } else {
        toast.error(data.error || 'Failed to create payment order')
        setPurchasingProduct(null)
      }
    } catch {
      toast.error('Failed to start payment')
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
            objective: 'Qualify lead and forward to agent',
            audience: 'Potential buyers',
            tone: 'Professional and confident',
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to generate script')
        return
      }

      const assistantMessage: CopilotMessage = {
        role: 'assistant',
        content: data.reply || 'I generated a script for you.',
        script: data.script || '',
        objections: data.objections || [],
      }
      setCopilotMessages(prev => [...prev, assistantMessage])
    } catch {
      toast.error('Script assistant is unavailable')
    } finally {
      setCopilotLoading(false)
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
    
    if (credits < numberList.length) {
      toast.error(`Not enough credits. Need ${numberList.length}, have ${credits}`)
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
          script,
          record: settings.recordCalls,
          transcribe: settings.transcribeCalls,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setCurrentCampaign(data.campaign)
        setIsCalling(true)
        fetchCampaigns()
        toast.success(data.message)
      } else {
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
    setActiveTab('call')
    toast.success('Campaign loaded into Call Center')
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
    if (tab === 'history' || tab === 'overview') {
      fetchCampaigns()
    }
  }

  const totalCalls = campaigns.reduce((sum, c) => sum + (c.results?.length || 0), 0)
  const totalNumbersQueued = campaigns.reduce((sum, c) => sum + (c.numbers?.length || 0), 0)
  const transcribedCount = recordings.filter(r => r.transcript).length
  const successRate = totalCalls > 0
    ? Math.round((campaigns.reduce((sum, c) => sum + (c.results?.filter(r => r.status === 'connected').length || 0), 0) / totalCalls) * 100)
    : 0
  const connectedCalls = campaigns.reduce((sum, c) => sum + (c.results?.filter(r => r.status === 'connected').length || 0), 0)
  const preparedNumbers = extractNumbers(numbers).length
  const readinessItems = [
    { label: 'Forwarding number configured', ready: !!settings.forwardToNumber?.trim(), tab: 'settings' },
    { label: 'Credits available', ready: credits > 0, tab: 'billing' },
    { label: 'Call script prepared', ready: script.trim().length >= 20, tab: 'call' },
    { label: 'Lead list imported', ready: preparedNumbers > 0, tab: 'call' },
    {
      label: managedMode ? 'Dedicated caller number active' : 'Provider credentials configured',
      ready: managedMode ? !!(assignedPhoneNumber || settings.twilioPhoneNumber) : isConfigured,
      tab: managedMode ? 'billing' : 'settings',
    },
  ]
  const readinessScore = Math.round((readinessItems.filter(item => item.ready).length / readinessItems.length) * 100)
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
      ? 'Platform Overview'
      : activeTab === 'call'
      ? 'Call Operations'
      : activeTab === 'recordings'
        ? 'Conversation Intelligence'
        : activeTab === 'history'
          ? 'Campaign Activity'
          : activeTab === 'billing'
            ? 'Billing & Growth'
          : 'Workspace Settings'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a2b24_0%,#0a0a0b_40%,#09090b_100%)] text-white">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingRecording(null)} />
      
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 ring-1 ring-emerald-300/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Auto Caller Platform</h1>
              <p className="text-xs text-zinc-400">Built by <a href="https://1hundred.ai" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">1hundred.ai</a></p>
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
            {managedMode && assignedPhoneNumber && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700">
                <span className="text-xs text-zinc-400">Number:</span>
                <span className="text-xs font-semibold text-emerald-400">{assignedPhoneNumber}</span>
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
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Workspace</p>
              <h2 className="text-xl font-semibold tracking-tight">{activeTabTitle}</h2>
              <p className="text-sm text-zinc-400 mt-1">Run campaigns, review conversations, and operate your outbound pipeline.</p>
            </div>
            <div className="text-xs text-zinc-400">
              {isCalling ? 'Campaign currently running' : 'No active campaign'}
            </div>
          </div>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 h-auto bg-transparent p-0">
            <TabsTrigger value="overview" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/40">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="call" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/40">
              <Phone className="w-4 h-4 mr-2" />
              Call Center
            </TabsTrigger>
            <TabsTrigger value="recordings" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/40">
              <Mic className="w-4 h-4 mr-2" />
              Recordings
            </TabsTrigger>
            <TabsTrigger value="history" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/40">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="billing" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/40">
              <Wallet className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-11 rounded-xl border border-zinc-800 bg-zinc-900/80 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/40">
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
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Launch Readiness
                  </CardTitle>
                  <CardDescription>
                    Complete these checks to run dependable campaigns for customers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-zinc-300">Readiness Score</p>
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
                    <Target className="w-5 h-5 text-emerald-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setActiveTab('call')}>
                    <Phone className="w-4 h-4 mr-2" />
                    Start New Campaign
                  </Button>
                  <Button variant="secondary" className="w-full justify-start bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('billing')}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Buy Credits / Number
                  </Button>
                  <Button variant="secondary" className="w-full justify-start bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('recordings')}>
                    <Mic className="w-4 h-4 mr-2" />
                    Review Conversations
                  </Button>
                  <Button variant="secondary" className="w-full justify-start bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Update Workspace Settings
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
                  <CardTitle className="text-lg">Revenue Inputs</CardTitle>
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
                    <span className="text-zinc-400">Assigned Number</span>
                    <span className="font-semibold">{assignedPhoneNumber || 'Not Assigned'}</span>
                  </div>
                  <Button variant="secondary" className="w-full bg-zinc-800 hover:bg-zinc-700" onClick={() => setActiveTab('billing')}>
                    Open Billing Workspace
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Call Center Tab */}
          <TabsContent value="call" className="space-y-6 animate-in fade-in-50 duration-200">
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
                      Paste numbers or upload CSV (one per line)
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

                {/* Voice & Script */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-emerald-400" />
                      Voice & Script
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
                      <Label>Call Script</Label>
                      <Textarea
                        placeholder="What should the AI say when they answer?"
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        disabled={isCalling}
                        className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
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
                      AI Script Copilot
                    </CardTitle>
                    <CardDescription>
                      Chat with AI to generate and refine your call script instantly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-3">
                      {copilotMessages.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                          Ask for a script, objection handling, or tone variations.
                        </p>
                      ) : (
                        copilotMessages.map((msg, idx) => (
                          <div key={idx} className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-zinc-800/80' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                            <p className="text-xs uppercase tracking-wide text-zinc-400 mb-1">{msg.role === 'user' ? 'You' : 'Copilot'}</p>
                            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
                            {msg.script && (
                              <div className="mt-3 p-3 rounded-md bg-zinc-900 border border-zinc-700 space-y-2">
                                <p className="text-xs text-zinc-400">Suggested Script</p>
                                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.script}</p>
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() => {
                                    setScript(msg.script || '')
                                    toast.success('Script applied to campaign')
                                  }}
                                >
                                  Use This Script
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
                        placeholder="Example: Write a concise script for first-time home buyers in Dubai"
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
                      disabled={loading || !isConfigured}
                      className="flex-1 h-14 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Calling
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
                      {isCalling ? 'Calling...' : 'Status'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isCalling && currentCampaign ? (
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
                        </div>
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
                      Monetization Workspace
                    </CardTitle>
                    <CardDescription>
                      Sell access with a dedicated number and prepaid credits using PayPal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-3">
                        <p className="text-sm font-semibold">Dedicated Caller Number</p>
                        <p className="text-xs text-zinc-400">
                          {assignedPhoneNumber
                            ? `Active number: ${assignedPhoneNumber}`
                            : 'No number assigned yet. Purchase to activate.'}
                        </p>
                        <Button
                          disabled={!!assignedPhoneNumber || purchasingProduct === 'number_activation'}
                          onClick={() => purchaseProduct('number_activation', 39, 0)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {assignedPhoneNumber
                            ? 'Number Active'
                            : (purchasingProduct === 'number_activation' ? 'Processing...' : 'Buy Number - $39')}
                        </Button>
                      </div>

                      <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-3">
                        <p className="text-sm font-semibold">Credit Balance</p>
                        <p className="text-3xl font-bold text-emerald-400">{credits}</p>
                        <p className="text-xs text-zinc-500">One credit is consumed per outbound call attempt.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Top Up Credits</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <button
                          type="button"
                          disabled={purchasingProduct !== null}
                          onClick={() => purchaseProduct('credits_500', 49, 500)}
                          className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 text-left hover:border-emerald-500/40 transition disabled:opacity-50"
                        >
                          <p className="text-lg font-semibold">500 Credits</p>
                          <p className="text-sm text-zinc-400">$49</p>
                          <p className="text-xs text-zinc-500 mt-2">Starter campaigns</p>
                        </button>
                        <button
                          type="button"
                          disabled={purchasingProduct !== null}
                          onClick={() => purchaseProduct('credits_1500', 129, 1500)}
                          className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 text-left hover:border-emerald-500/40 transition disabled:opacity-50"
                        >
                          <p className="text-lg font-semibold">1,500 Credits</p>
                          <p className="text-sm text-zinc-400">$129</p>
                          <p className="text-xs text-zinc-500 mt-2">Growth package</p>
                        </button>
                        <button
                          type="button"
                          disabled={purchasingProduct !== null}
                          onClick={() => purchaseProduct('credits_5000', 349, 5000)}
                          className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 text-left hover:border-emerald-500/40 transition disabled:opacity-50"
                        >
                          <p className="text-lg font-semibold">5,000 Credits</p>
                          <p className="text-sm text-zinc-400">$349</p>
                          <p className="text-xs text-zinc-500 mt-2">Scale package</p>
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500">Secure checkout is processed via PayPal. Credits are applied automatically after payment.</p>
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
                      <span className="text-zinc-400">Assigned Number</span>
                      <span className="font-semibold">{assignedPhoneNumber || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Current Credits</span>
                      <span className="font-semibold text-emerald-400">{credits}</span>
                    </div>
                    <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                      Use this screen as your customer-facing payments hub for number provisioning and usage credits.
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
                  Configuration
                </CardTitle>
                <CardDescription>
                  {managedMode
                    ? 'Your account is fully managed. Configure forwarding, billing, and campaign preferences.'
                    : 'Enter your API keys. All data is stored locally.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {managedMode ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-300 font-medium">Managed Platform Active</p>
                    <p className="text-xs text-zinc-300 mt-1">
                      API keys are handled by the platform. You only manage your forwarding number, credits, and script workflow.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ElevenLabs */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-emerald-400">ElevenLabs (Voice)</h3>
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          placeholder="xi-xxxxxxxxxxxxx"
                          value={settings.elevenLabsApiKey}
                          onChange={(e) => setSettings({ ...settings, elevenLabsApiKey: e.target.value })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>

                    {/* Twilio */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-emerald-400">Twilio (Calling)</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Account SID</Label>
                          <Input
                            type="password"
                            placeholder="ACxxxxxxxxxxxxx"
                            value={settings.twilioAccountSid}
                            onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Auth Token</Label>
                          <Input
                            type="password"
                            placeholder="xxxxxxxxxxxxx"
                            value={settings.twilioAuthToken}
                            onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Twilio Phone Number</Label>
                        <Input
                          placeholder="+1234567890"
                          value={settings.twilioPhoneNumber}
                          onChange={(e) => setSettings({ ...settings, twilioPhoneNumber: e.target.value })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>

                    {/* OpenAI for Transcription */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-emerald-400">OpenAI (Transcription & Analysis)</h3>
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          placeholder="sk-xxxxxxxxxxxxx"
                          value={settings.openaiApiKey}
                          onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-500">Required for Whisper transcription and GPT-4 analysis</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Business Profile */}
                <div className="space-y-4">
                  <h3 className="font-medium text-emerald-400">Business Profile</h3>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      placeholder="Your company name"
                      value={settings.businessName || ''}
                      onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                    />
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
      </main>
    </div>
  )
}
