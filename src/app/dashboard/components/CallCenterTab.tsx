import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { 
  Phone, 
  Users, 
  Volume2, 
  Bot, 
  Play, 
  Square, 
  Clock, 
  PhoneOff, 
  RefreshCw, 
  Send, 
  Upload, 
  Sparkles 
} from "lucide-react"

interface CallCenterTabProps {
  workspaceIntelligence: any
  numbers: string
  setNumbers: (val: string) => void
  isCalling: boolean
  csvInputRef: React.RefObject<HTMLInputElement | null>
  handleCsvImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  selectedCallerIdentityId: string | null
  setSelectedCallerIdentityId: (id: string) => void
  callerIdentities: any[]
  applyIdentityToComposer: (identity: any) => void
  scheduledAt: string
  setScheduledAt: (val: string) => void
  leadNotesText: string
  setLeadNotesText: (val: string) => void
  extractNumbers: (text: string) => string[]
  selectedVoice: string
  setSelectedVoice: (val: string) => void
  voices: any[]
  selectedLanguage: string
  setSelectedLanguage: (val: string) => void
  LANGUAGE_OPTIONS: any[]
  script: string
  setScript: (val: string) => void
  selectedCallerIdentity: any
  settings: any
  setSettings: (settings: any) => void
  copilotMessages: any[]
  copilotInput: string
  setCopilotInput: (val: string) => void
  askCopilot: () => void
  copilotLoading: boolean
  loading: boolean
  isConfigured: boolean
  managedMode: boolean
  startCalling: () => void
  stopCalling: () => void
  currentCampaign: any
  stats: any
  campaigns: any[]
  recordings: any[]
  credits: number
  toast: any
  sampleCsvHref: string
  onStartTestCall: () => void
  testingCall: boolean
}

export function CallCenterTab({
  workspaceIntelligence,
  numbers,
  setNumbers,
  isCalling,
  csvInputRef,
  handleCsvImport,
  selectedCallerIdentityId,
  setSelectedCallerIdentityId,
  callerIdentities,
  applyIdentityToComposer,
  scheduledAt,
  setScheduledAt,
  leadNotesText,
  setLeadNotesText,
  extractNumbers,
  selectedVoice,
  setSelectedVoice,
  voices,
  selectedLanguage,
  setSelectedLanguage,
  LANGUAGE_OPTIONS,
  script,
  setScript,
  selectedCallerIdentity,
  settings,
  setSettings,
  copilotMessages,
  copilotInput,
  setCopilotInput,
  askCopilot,
  copilotLoading,
  loading,
  isConfigured,
  managedMode,
  startCalling,
  stopCalling,
  currentCampaign,
  stats,
  campaigns,
  recordings,
  credits,
  toast,
  sampleCsvHref,
  onStartTestCall,
  testingCall
}: CallCenterTabProps) {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in-50 duration-200">
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden border-orange-400/10">
        <CardContent className="p-0">
           <div className="bg-zinc-950/50 p-5 md:p-8 border-b border-zinc-800/50">
             <div className="flex items-center gap-3 md:gap-4">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center">
                 <Bot className="w-5 h-5 md:w-6 md:h-6 text-orange-300" />
               </div>
               <div className="space-y-1">
                 <h2 className="text-lg md:text-xl font-bold text-zinc-100">Smart Campaign Advisor</h2>
                 <p className="text-xs md:text-sm text-zinc-400">Current coaching tips for your outreach strategy.</p>
               </div>
             </div>
             <div className="grid gap-3 md:gap-4 md:grid-cols-3 mt-5 md:mt-8">
               {workspaceIntelligence.coachingTips.slice(0, 3).map((tip: string, index: number) => (
                 <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 relative overflow-hidden group hover:border-orange-400/30 transition-all">
                    <p className="text-sm text-zinc-300 relative z-10 leading-relaxed italic">"{tip}"</p>
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-8 h-8 text-orange-400" />
                    </div>
                 </div>
               ))}
             </div>
           </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-orange-300" />
                Target Audience
              </CardTitle>
              <CardDescription>
                Paste phone numbers or upload a CSV. Each line should be one number.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv,.txt"
                onChange={handleCsvImport}
                className="hidden"
              />
              <div className="relative">
                <Textarea
                  placeholder="+971 50 123 4567\n+971 55 987 6543\n+971 56 456 7890"
                  value={numbers}
                  onChange={(e) => setNumbers(e.target.value)}
                  disabled={isCalling}
                  className="min-h-[200px] bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-2xl p-4 md:p-6 text-base md:text-lg focus:ring-orange-400/30"
                />
                <div className="mt-3 md:mt-0 md:absolute md:bottom-4 md:right-4 flex flex-wrap items-center gap-2">
                   <Badge className="w-full sm:w-auto justify-center bg-zinc-900/80 text-zinc-400 border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                     {extractNumbers(numbers).length} Numbers Found
                   </Badge>
                   <Button
                      asChild
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 h-10 md:h-9 rounded-lg border border-zinc-700/50"
                    >
                      <a href={sampleCsvHref} download>
                        Download Sample CSV
                      </a>
                    </Button>
                   <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 h-10 md:h-9 rounded-lg border border-zinc-700/50"
                      onClick={() => csvInputRef.current?.click()}
                      disabled={isCalling}
                    >
                      <Upload className="w-3.5 h-3.5 mr-2" />
                      Import CSV
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 h-10 md:h-9 rounded-lg border border-zinc-700/50"
                      onClick={onStartTestCall}
                      disabled={testingCall}
                    >
                      {testingCall ? 'Calling...' : 'Test Call To My Number'}
                    </Button>
                </div>
              </div>

              <div className="grid gap-5 md:gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Assign Active Agent</Label>
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
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl">
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No agent assigned</SelectItem>
                      {callerIdentities.map(identity => (
                        <SelectItem key={identity.id} value={identity.id}>
                          {identity.name} ({identity.position}) {identity.dedicatedNumber ? '• Line Active' : '• No Line'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Schedule Launch (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    disabled={isCalling}
                    className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Lead Intelligence Notes (Optional)</Label>
                <Textarea
                  placeholder={"number | comment | goal\ne.g. +971501234567 | spoke last week | qualify for villa launch"}
                  value={leadNotesText}
                  onChange={(e) => setLeadNotesText(e.target.value)}
                  disabled={isCalling}
                  className="min-h-[100px] bg-zinc-800/50 border-zinc-700 rounded-xl text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                <Volume2 className="w-5 h-5 md:w-6 md:h-6 text-orange-300" />
                Agent Behavior & Blueprint
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Voice & Language</p>
                <p className="mt-2 text-sm text-zinc-300">
                  Managed by your selected agent profile. Voice selection is controlled by admin presets for quality consistency.
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Current: {selectedCallerIdentity?.name || 'No agent selected'} • {selectedCallerIdentity?.language || selectedLanguage || 'en-US'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Campaign Target Blueprint</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-300 hover:text-orange-300 hover:bg-orange-400/10 h-7 rounded-lg font-bold"
                    onClick={() => {
                      const goal = prompt("What is your goal for this campaign?")
                      if (goal) {
                        setCopilotInput(`Generate a target blueprint for: ${goal}`)
                        askCopilot()
                      }
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Smart Suggest
                  </Button>
                </div>
                <Textarea
                  placeholder={"Goal: qualify and transfer\nAudience: investors in Dubai\nOffer: off-plan launch with payment plan\nQualification: budget, timeline, decision maker\nCTA: connect now with specialist"}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  disabled={isCalling}
                  className="min-h-[160px] bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-2xl p-4 md:p-6 text-base md:text-lg leading-relaxed focus:ring-orange-400/30"
                />
                {selectedCallerIdentity && (
                  <div className="pt-2 flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                     <p className="text-xs text-zinc-400 font-medium italic">
                        Agent Active: {selectedCallerIdentity.name} ({selectedCallerIdentity.position})
                     </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-5 sm:gap-10 p-4 md:p-6 rounded-2xl bg-zinc-950/20 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.recordCalls}
                    onCheckedChange={(checked) => setSettings({ ...settings, recordCalls: checked })}
                    disabled={isCalling}
                  />
                  <Label className="text-sm font-semibold text-zinc-300">Record Conversations</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.transcribeCalls}
                    onCheckedChange={(checked) => setSettings({ ...settings, transcribeCalls: checked })}
                    disabled={isCalling}
                  />
                  <Label className="text-sm font-semibold text-zinc-300">Auto-Transcribe</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-2 md:pt-4">
            {!isCalling ? (
              <Button 
                onClick={startCalling}
                disabled={loading || !isConfigured || (managedMode && !!selectedCallerIdentityId && !selectedCallerIdentity?.dedicatedNumber)}
                className="w-full h-14 md:h-20 text-lg md:text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 rounded-2xl shadow-2xl shadow-orange-400/20 group"
              >
                <Play className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-4 group-hover:scale-110 transition-transform" />
                {scheduledAt ? 'Schedule Outreach' : 'Launch Outreach Campaign'}
              </Button>
            ) : (
              <Button 
                onClick={stopCalling}
                variant="destructive"
                className="w-full h-14 md:h-20 text-lg md:text-2xl font-bold rounded-2xl shadow-2xl shadow-red-500/20 group"
              >
                <Square className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-4 group-hover:scale-90 transition-transform" />
                Stop Active Campaign
              </Button>
            )}
            {managedMode && !!selectedCallerIdentityId && !selectedCallerIdentity?.dedicatedNumber && (
               <p className="mt-4 text-center text-sm text-amber-400 font-medium">
                  This agent needs an active line. Head to the <button onClick={() => toast.info('Open Agents tab')} className="underline">Agents tab</button> to activate one.
               </p>
            )}
          </div>
        </div>

        <div className="space-y-6 md:space-y-8">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
            <CardHeader className="pb-4 md:pb-6 bg-zinc-950/50 border-b border-zinc-800/50">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                {isCalling ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-400"></span>
                  </span>
                ) : (
                  <Clock className="w-5 h-5 text-zinc-400" />
                )}
                {isCalling ? 'Live Monitoring' : currentCampaign?.status === 'scheduled' ? 'Scheduled Launch' : 'Campaign Status'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6 pt-5 md:pt-8 px-5 md:px-8 pb-5 md:pb-8">
              {currentCampaign ? (
                currentCampaign.status === 'scheduled' ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                       <Clock className="w-5 h-5 text-amber-400" />
                       <p className="text-sm font-bold text-amber-200 uppercase tracking-widest">Queued</p>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This campaign will start automatically on: <br/>
                      <span className="text-zinc-200 font-bold mt-1 block">{new Date(currentCampaign.scheduledAt || currentCampaign.createdAt).toLocaleString()}</span>
                    </p>
                    <Badge className="bg-zinc-900/80 text-zinc-300 border-zinc-800 px-3 py-1 mt-2">
                      {currentCampaign.numbers?.length || 0} Targets Assigned
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-6 md:space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                        <span>Campaign Progress</span>
                        <span className="text-zinc-200">{stats.connected + stats.failed + (stats.noAnswer || 0) + (stats.voicemail || 0)} / {stats.total}</span>
                      </div>
                      <Progress value={stats.total > 0 ? ((stats.connected + stats.failed + (stats.noAnswer || 0) + (stats.voicemail || 0)) / stats.total) * 100 : 0} className="h-2 bg-zinc-800" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="p-5 rounded-2xl bg-orange-400/5 border border-orange-400/10 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-orange-300">{stats.connected}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Connected</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-red-400">{stats.failed}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Failed</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-zinc-800/30 border border-zinc-700/40 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-zinc-200">{stats.noAnswer || 0}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">No Answer</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-amber-300">{stats.voicemail || 0}</div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Voicemail</div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <PhoneOff className="w-16 h-16 mx-auto mb-4 opacity-10 text-zinc-400" />
                  <p className="text-sm text-zinc-500 font-medium">No campaign is currently active.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-orange-400/5">
            <CardHeader className="pb-4 md:pb-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-orange-300" />
                 Campaign Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6 px-5 md:px-8 pb-5 md:pb-8 text-sm">
              <div className="flex justify-between items-center group">
                <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Total Historical Calls</span>
                <span className="font-bold text-zinc-200">{campaigns.reduce((sum, c) => sum + (c.results?.length || 0), 0)}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Active Recordings</span>
                <span className="font-bold text-orange-300">{recordings.length}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">Workspace Credits</span>
                <span className="font-bold text-orange-300">{credits}</span>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                 <p className="text-xs text-zinc-500 italic leading-relaxed">
                   Launch your campaign to see real-time updates and lead intelligence.
                 </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-orange-400/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-300" />
                Assistant-first Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>
                Strategy chat is now centralized in the main Assistant workspace to avoid duplicate bots and conflicting instructions.
              </p>
              <p className="text-zinc-500">
                Use the Assistant tab for blueprint generation, file context, and verification. Call Center stays focused on execution.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
