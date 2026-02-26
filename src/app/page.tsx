'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Sparkles
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
  })
  const [credits, setCredits] = useState(0)
  const [isConfigured, setIsConfigured] = useState(false)
  
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
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // UI state
  const [activeTab, setActiveTab] = useState('call')
  const [loading, setLoading] = useState(false)
  const initRef = useRef(false)

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
      
      // Fetch campaigns
      try {
        const res = await fetch('/api/calls')
        const data = await res.json()
        setCampaigns(data.campaigns || [])
        const active = data.campaigns?.find((c: Campaign) => c.status === 'running')
        if (active) {
          setCurrentCampaign(active)
          setIsCalling(true)
        }
      } catch {
        console.error('Failed to load campaigns')
      }
      
      // Fetch recordings
      try {
        const res = await fetch('/api/recordings')
        const data = await res.json()
        setRecordings(data.recordings || [])
      } catch {
        console.error('Failed to load recordings')
      }
    }
    
    init()
  }, [])

  // Fetch recordings when tab changes
  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch('/api/recordings')
      const data = await res.json()
      setRecordings(data.recordings || [])
    } catch {
      console.error('Failed to load recordings')
    }
  }, [])

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
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    }
    setLoading(false)
  }

  // Start calling
  const startCalling = async () => {
    if (!isConfigured) {
      toast.error('Please configure your settings first')
      setActiveTab('settings')
      return
    }
    
    const numberList = numbers
      .split(/[\n,]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0)
    
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
      toast.success('Campaign stopped')
    } catch {
      toast.error('Failed to stop campaign')
    }
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingRecording(null)} />
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Auto Caller Pro</h1>
              <p className="text-xs text-zinc-400">by <a href="https://1hundred.ai" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition">1hundred.ai</a></p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-xs text-zinc-400 hover:text-emerald-400 transition">
              Upgrade
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700">
              <span className="text-xs text-zinc-400">Credits:</span>
              <span className="text-sm font-bold text-emerald-400">{credits}</span>
            </div>
            
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
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab)
          if (tab === 'recordings') fetchRecordings()
        }} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="call" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Phone className="w-4 h-4 mr-2" />
              Call Center
            </TabsTrigger>
            <TabsTrigger value="recordings" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Mic className="w-4 h-4 mr-2" />
              Recordings
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Call Center Tab */}
          <TabsContent value="call" className="space-y-6">
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
                    <Textarea
                      placeholder="+971 50 123 4567&#10;+971 55 987 6543&#10;+971 56 456 7890"
                      value={numbers}
                      onChange={(e) => setNumbers(e.target.value)}
                      disabled={isCalling}
                      className="min-h-[150px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                      <span>{numbers.split(/[\n,]+/).filter(n => n.trim()).length} numbers</span>
                      <Button variant="ghost" size="sm" className="text-xs">
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
                          <Progress value={(stats.connected + stats.failed) / stats.total * 100} className="h-2" />
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
          <TabsContent value="recordings" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recordings List */}
              <div className="lg:col-span-2 space-y-4">
                {recordings.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 text-center text-zinc-500">
                      <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No recordings yet</p>
                      <p className="text-sm mt-2">Enable recording in settings to capture calls</p>
                    </CardContent>
                  </Card>
                ) : (
                  recordings.map((recording) => (
                    <Card key={recording.id} className="bg-zinc-900 border-zinc-800">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <Mic className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{recording.phoneNumber}</CardTitle>
                              <p className="text-xs text-zinc-400">
                                {new Date(recording.createdAt).toLocaleString()} • {recording.duration}s
                              </p>
                            </div>
                          </div>
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
                        <span className="font-bold">{recordings.length}</span>
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
                    <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400">Positive</span>
                        <span className="font-bold">
                          {recordings.filter(r => r.transcript?.sentiment === 'positive').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Neutral</span>
                        <span className="font-bold">
                          {recordings.filter(r => r.transcript?.sentiment === 'neutral').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-red-400">Negative</span>
                        <span className="font-bold">
                          {recordings.filter(r => r.transcript?.sentiment === 'negative').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
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
                          <Badge 
                            className={campaign.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                          >
                            {campaign.status}
                          </Badge>
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

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Enter your API keys. All data is stored locally.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
