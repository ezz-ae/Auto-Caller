import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Users, Info, Trash2, Sparkles, Volume2 } from "lucide-react"

interface VoiceAgentsTabProps {
  callerIdentities: any[]
  identityForm: any
  setIdentityForm: React.Dispatch<React.SetStateAction<any>>
  identityLoading: boolean
  editingCallerIdentityId: string | null
  saveCallerIdentity: () => void
  resetCallerIdentityForm: () => void
  applyIdentityToComposer: (identity: any) => void
  editCallerIdentity: (identity: any) => void
  previewIdentityVoice: (voiceId: string, language: string) => void
  removeCallerIdentity: (id: string) => void
  filteredIdentityVoices: any[]
  showAdvancedCallerInputs: boolean
  setShowAdvancedCallerInputs: React.Dispatch<React.SetStateAction<boolean>>
  voicePreviewText: string
  setVoicePreviewText: (text: string) => void
  previewingVoice: string | null
  selectedIdentityVoice: any
  managedMode: boolean
  openNumberPurchaseModal: (id: string, name: string) => void
  numberActivationPrice: number
  LANGUAGE_OPTIONS: any[]
  selectedCallerIdentityId: string | null
  ttsHealth: { provider: 'elevenlabs' | 'csm'; status: 'ready' | 'disabled' | 'unreachable' | 'gpu_missing' | 'loading'; detail?: string; modelId?: string } | null
  loadingTtsHealth: boolean
}

export function VoiceAgentsTab({
  callerIdentities,
  identityForm,
  setIdentityForm,
  identityLoading,
  editingCallerIdentityId,
  saveCallerIdentity,
  resetCallerIdentityForm,
  applyIdentityToComposer,
  editCallerIdentity,
  previewIdentityVoice,
  removeCallerIdentity,
  filteredIdentityVoices,
  showAdvancedCallerInputs,
  setShowAdvancedCallerInputs,
  voicePreviewText,
  setVoicePreviewText,
  previewingVoice,
  selectedIdentityVoice,
  managedMode,
  openNumberPurchaseModal,
  numberActivationPrice,
  LANGUAGE_OPTIONS,
  selectedCallerIdentityId,
  ttsHealth,
  loadingTtsHealth
}: VoiceAgentsTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="w-7 h-7 text-orange-400" />
                Hire Agents
              </CardTitle>
              <CardDescription className="text-base text-zinc-400">
                Hire pre-built outbound agents by role, language, and objective.
              </CardDescription>
            </div>
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Active Agents</p>
              <p className="text-xl font-bold text-zinc-100">{callerIdentities.length}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-10 pt-8 px-8">
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-100">Conversation-first mode active.</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                Tell Maya the offer, ICP, and success event. The platform auto-assigns the best voice profile per hired agent.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
            <div className="md:col-span-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-400 font-medium">
                  Voice infrastructure is platform-managed for consistency.
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Runtime health: {loadingTtsHealth ? 'Checking…' : (ttsHealth?.status || 'unknown')}
                </p>
                {!loadingTtsHealth && ttsHealth?.detail && (
                  <p className="text-[11px] text-zinc-500 mt-1">{ttsHealth.detail}</p>
                )}
              </div>
              <Badge
                className={
                  ttsHealth?.status === 'ready'
                    ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }
              >
                {ttsHealth?.provider === 'csm' ? 'Sesame CSM' : 'ElevenLabs'}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-400 uppercase tracking-tighter text-[10px] font-bold">Agent Name</Label>
              <Input
                placeholder="e.g., Sara"
                value={identityForm.name}
                onChange={e => setIdentityForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl focus:ring-orange-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 uppercase tracking-tighter text-[10px] font-bold">Role / Position</Label>
              <Input
                placeholder="e.g., Lead Reactivation Specialist"
                value={identityForm.position}
                onChange={e => setIdentityForm(prev => ({ ...prev, position: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 uppercase tracking-tighter text-[10px] font-bold">Gender Profile</Label>
              <Select value={identityForm.gender} onValueChange={(value) => setIdentityForm(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 uppercase tracking-tighter text-[10px] font-bold">Primary Language</Label>
              <Select value={identityForm.language} onValueChange={(value) => setIdentityForm(prev => ({ ...prev, language: value }))}>
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl">
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
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-zinc-400 uppercase tracking-tighter text-[10px] font-bold">Voice Profile</Label>
              <div className="h-12 rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 flex items-center text-sm text-zinc-300">
                {selectedIdentityVoice
                  ? `${selectedIdentityVoice.name} • ${selectedIdentityVoice.language || selectedIdentityVoice.labels?.language || 'multi'}`
                  : 'Auto-assigned from role + language'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800 group hover:border-zinc-700 transition-colors">
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-200">Advanced behavior controls</p>
              <p className="text-sm text-zinc-500">Fine-tune industry knowledge and custom rules.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="bg-zinc-800 hover:bg-zinc-700 rounded-xl h-11 px-6 border border-zinc-700/50"
              onClick={() => setShowAdvancedCallerInputs(prev => !prev)}
            >
              {showAdvancedCallerInputs ? 'Hide Advanced' : 'Show Advanced'}
            </Button>
          </div>

          {showAdvancedCallerInputs && (
            <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Industry focus</Label>
                  <Input
                    placeholder="e.g., Real Estate"
                    value={identityForm.industry}
                    onChange={e => setIdentityForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Global Goal</Label>
                  <Input
                    placeholder="e.g., Qualify and Transfer"
                    value={identityForm.campaignGoal}
                    onChange={e => setIdentityForm(prev => ({ ...prev, campaignGoal: e.target.value }))}
                    className="bg-zinc-800/50 border-zinc-700 rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-orange-400" />
                  <p className="text-base font-semibold text-zinc-100">Voice Quality Test</p>
                </div>
                <Textarea
                  placeholder="Type a sample message here to hear how your agent sounds..."
                  value={voicePreviewText}
                  onChange={e => setVoicePreviewText(e.target.value)}
                  className="min-h-[100px] bg-zinc-900 border-zinc-700 rounded-xl text-lg italic"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-zinc-500">
                    Selected: <span className="text-zinc-300">{selectedIdentityVoice ? selectedIdentityVoice.name : 'None'}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      className="bg-orange-500 hover:bg-orange-600 h-11 px-8 rounded-xl shadow-lg shadow-orange-500/20"
                      onClick={() => previewIdentityVoice(identityForm.voiceId, identityForm.language)}
                      disabled={!identityForm.voiceId || !!previewingVoice}
                    >
                      {previewingVoice === identityForm.voiceId ? 'Speaking...' : 'Test Voice'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Behavior Rules (Do)</Label>
                  <Textarea
                    placeholder='e.g., "Must mention our weekend sale", "Speak slowly"'
                    value={identityForm.sayThisRules}
                    onChange={e => setIdentityForm(prev => ({ ...prev, sayThisRules: e.target.value }))}
                    className="min-h-[100px] bg-zinc-800/50 border-zinc-700 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Behavior Rules (Avoid)</Label>
                  <Textarea
                    placeholder='e.g., "Don&apos;t mention price until end", "Avoid technical jargon"'
                    value={identityForm.avoidThisRules}
                    onChange={e => setIdentityForm(prev => ({ ...prev, avoidThisRules: e.target.value }))}
                    className="min-h-[100px] bg-zinc-800/50 border-zinc-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Target Agent Blueprint</Label>
                <Textarea
                  placeholder={"How should the agent handle the call?\ne.g., Qualify leads by asking about their budget and timeline. If they are ready, offer a 15-minute consultation."}
                  value={identityForm.script}
                  onChange={e => setIdentityForm(prev => ({ ...prev, script: e.target.value }))}
                  className="min-h-[120px] bg-zinc-800/50 border-zinc-700 rounded-xl leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-zinc-200">Automated-call Disclosure</p>
                  <p className="text-sm text-zinc-500">Enable to include transparent automated-call notice and opt-out wording.</p>
                </div>
                <Switch
                  checked={identityForm.mentionAi}
                  onCheckedChange={(checked) => setIdentityForm(prev => ({ ...prev, mentionAi: checked }))}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              type="button"
              onClick={saveCallerIdentity}
              disabled={identityLoading}
              className="bg-orange-500 hover:bg-orange-600 h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-orange-500/20"
            >
              {identityLoading ? 'Saving...' : (editingCallerIdentityId ? 'Update Agent' : 'Hire Agent')}
            </Button>
            {editingCallerIdentityId && (
              <Button
                type="button"
                variant="secondary"
                className="bg-zinc-800 hover:bg-zinc-700 h-14 px-8 rounded-2xl border border-zinc-700"
                onClick={resetCallerIdentityForm}
                disabled={identityLoading}
              >
                Cancel Edit
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-8 border-t border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-100 mb-6">Your Team of Agents</h3>
            {callerIdentities.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No agents hired yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {callerIdentities.map(identity => {
                  const successRate = identity.totalCalls > 0
                    ? Math.round((identity.connectedCalls / identity.totalCalls) * 100)
                    : 0
                  const isActive = selectedCallerIdentityId === identity.id
                  return (
                    <div key={identity.id} className={`group rounded-2xl border p-6 transition-all duration-300 ${isActive ? 'border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/5' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-orange-400">
                              {identity.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-zinc-100">
                                {identity.name} <span className="text-zinc-500 text-sm font-medium">({identity.position})</span>
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px] uppercase">{identity.gender}</Badge>
                                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px] uppercase">{identity.language}</Badge>
                                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px] uppercase">{identity.industry || 'General'}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 pl-1">
                             <p className="text-xs text-zinc-500">
                               <span className="font-bold text-zinc-400 tracking-widest uppercase text-[9px] mr-2">Active Line:</span>
                               {identity.dedicatedNumber || 'Not assigned'}
                             </p>
                             <div className="flex items-center gap-6 mt-4">
                                <div className="space-y-0.5">
                                   <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Calls</p>
                                   <p className="text-sm font-bold text-zinc-200">{identity.totalCalls}</p>
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Connected</p>
                                   <p className="text-sm font-bold text-orange-400">{identity.connectedCalls}</p>
                                </div>
                                <div className="space-y-0.5">
                                   <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Success</p>
                                   <p className="text-sm font-bold text-orange-400">{successRate}%</p>
                                </div>
                             </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!identity.dedicatedNumber && managedMode && (
                            <Button
                              type="button"
                              className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-xl shadow-lg shadow-blue-600/20"
                              onClick={() => openNumberPurchaseModal(identity.id, identity.name)}
                            >
                              {`Buy Active Line - $${numberActivationPrice.toFixed(2)}`}
                            </Button>
                          )}
                          {identity.dedicatedNumber && (
                            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1">
                              Line Active
                            </Badge>
                          )}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="bg-zinc-800 hover:bg-zinc-700 rounded-lg h-9"
                              onClick={() => applyIdentityToComposer(identity)}
                            >
                              Use
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="bg-zinc-800 hover:bg-zinc-700 rounded-lg h-9"
                              onClick={() => editCallerIdentity(identity)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg h-9"
                              onClick={() => removeCallerIdentity(identity.id)}
                              disabled={identityLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
        <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-zinc-400 leading-relaxed">
          Your agents are specialized to handle different markets and goals. Assign them to campaigns in the <span className="text-orange-400 font-bold">Call Center</span> to start reaching your leads.
        </p>
      </div>
    </div>
  )
}
