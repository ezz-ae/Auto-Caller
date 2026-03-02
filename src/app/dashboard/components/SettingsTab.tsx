import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Settings, UserPlus, Trash2, Info, ShieldCheck, Briefcase } from "lucide-react"

interface SettingsTabProps {
  settings: any
  setSettings: (settings: any) => void
  setActiveTab: (tab: string) => void
  teamForm: any
  setTeamForm: React.Dispatch<React.SetStateAction<any>>
  addTeamMember: () => void
  teamLoading: boolean
  teamMembers: any[]
  toggleTeamMember: (member: any) => void
  removeTeamMember: (id: string) => void
  complianceLeadNumber: string
  setComplianceLeadNumber: (value: string) => void
  exportComplianceLogs: () => void
  deleteLeadAndSuppress: () => void
  complianceLoading: boolean
}

export function SettingsTab({
  settings,
  setSettings,
  setActiveTab,
  teamForm,
  setTeamForm,
  addTeamMember,
  teamLoading,
  teamMembers,
  toggleTeamMember,
  removeTeamMember,
  complianceLeadNumber,
  setComplianceLeadNumber,
  exportComplianceLogs,
  deleteLeadAndSuppress,
  complianceLoading
}: SettingsTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in-50 duration-200">
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center">
                 <Settings className="w-6 h-6 text-orange-300" />
              </div>
              <div>
                 <CardTitle className="text-2xl font-bold">Workspace Configuration</CardTitle>
                 <CardDescription className="text-zinc-400 mt-1">Global settings for your outreach agents, team, and security.</CardDescription>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
          <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-400/20 flex items-center justify-center shrink-0">
               <ShieldCheck className="w-5 h-5 text-orange-300" />
            </div>
            <div>
              <p className="text-base font-semibold text-orange-300">Managed Intelligence Mode</p>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                Infrastructure keys (Voice Engine, Telephony, and AI Models) are managed by the platform. Focus on your business profile and campaign strategy.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
               <Briefcase className="w-5 h-5 text-orange-300" />
               <h3 className="text-lg font-bold text-zinc-100">Business Profile</h3>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Brand Name</Label>
                <Input
                  placeholder="Your organization name"
                  value={settings.businessName || ''}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Market Industry</Label>
                <Input
                  placeholder="e.g. Real Estate, Financial Services"
                  value={settings.industry || ''}
                  onChange={(e) => setSettings({ ...settings, industry: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Company Intelligence Context</Label>
              <Textarea
                placeholder="Describe your company's value proposition and core mission to help agents sound more natural."
                value={settings.companyDetails || ''}
                onChange={(e) => setSettings({ ...settings, companyDetails: e.target.value })}
                className="min-h-[100px] bg-zinc-800/50 border-zinc-700 rounded-xl leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-8 pt-8 border-t border-zinc-800/50">
             <div className="flex items-center gap-3 px-2">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
               <h3 className="text-lg font-bold text-zinc-100">Global Behavior Guards</h3>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-orange-300">Standard "Say This" Rules</Label>
                <Textarea
                  placeholder="Mandatory mentions: company name, purpose of call, next step..."
                  value={settings.sayThisRules || ''}
                  onChange={(e) => setSettings({ ...settings, sayThisRules: e.target.value })}
                  className="min-h-[100px] bg-zinc-800/50 border-zinc-700 rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-red-400">Standard "Avoid This" Rules</Label>
                <Textarea
                  placeholder="Prohibited mentions: guaranteed returns, price specific commitments..."
                  value={settings.avoidThisRules || ''}
                  onChange={(e) => setSettings({ ...settings, avoidThisRules: e.target.value })}
                  className="min-h-[100px] bg-zinc-800/50 border-zinc-700 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-zinc-200">Include automated-call disclosure</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Default ON. New agents will disclose that calls are automated and include opt-out wording.
                </p>
              </div>
              <Switch
                checked={settings.includeAutomatedDisclosure ?? true}
                onCheckedChange={(checked) => setSettings({ ...settings, includeAutomatedDisclosure: checked })}
              />
            </div>
          </div>

          <div className="space-y-8 pt-8 border-t border-zinc-800/50">
             <div className="flex items-center gap-3 px-2">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
               <h3 className="text-lg font-bold text-zinc-100">Routing & Recording</h3>
            </div>
            <div className="space-y-4">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Main Team Forwarding Number</Label>
              <Input
                placeholder="+971 50 123 4567"
                value={settings.forwardToNumber}
                onChange={(e) => setSettings({ ...settings, forwardToNumber: e.target.value })}
                className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl max-w-md"
              />
              <p className="text-xs text-zinc-500">When a lead is ready for a live agent, the AI will bridge them to this line.</p>
            </div>

            <div className="flex flex-wrap gap-12 p-8 rounded-[32px] bg-zinc-950/40 border border-zinc-800">
               <div className="flex items-center gap-4">
                 <Switch
                   checked={settings.recordCalls}
                   onCheckedChange={(checked) => setSettings({ ...settings, recordCalls: checked })}
                 />
                 <div className="space-y-0.5">
                    <p className="text-sm font-bold text-zinc-200">Record Outreach</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">Capture every conversation</p>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <Switch
                   checked={settings.transcribeCalls}
                   onCheckedChange={(checked) => setSettings({ ...settings, transcribeCalls: checked })}
                 />
                 <div className="space-y-0.5">
                    <p className="text-sm font-bold text-zinc-200">Auto-Intelligence</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">AI Transcripts & Summaries</p>
                 </div>
               </div>
            </div>
          </div>

          <div className="p-8 rounded-[32px] border border-zinc-800 bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-orange-400/20 transition-all duration-500">
            <div className="space-y-1">
              <p className="text-base font-bold text-zinc-100 tracking-tight">Design & Manage Voice Agents</p>
              <p className="text-sm text-zinc-500">Create, edit, and train your outreach outreach team.</p>
            </div>
            <Button variant="secondary" className="h-12 px-8 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 font-bold" onClick={() => setActiveTab('callers')}>
              Go to Agents Tab
            </Button>
          </div>

          <div className="space-y-6 pt-8 border-t border-zinc-800/50">
            <div className="flex items-center gap-3 px-2">
              <ShieldCheck className="w-5 h-5 text-orange-300" />
              <h3 className="text-lg font-bold text-zinc-100">Compliance Center</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                className="h-12 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700"
                onClick={exportComplianceLogs}
                disabled={complianceLoading}
              >
                Export Compliance Logs
              </Button>
              <div className="flex gap-2">
                <Input
                  placeholder="+971501234567"
                  value={complianceLeadNumber}
                  onChange={e => setComplianceLeadNumber(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
                />
                <Button
                  type="button"
                  variant="destructive"
                  className="h-12 rounded-xl"
                  onClick={deleteLeadAndSuppress}
                  disabled={complianceLoading || !complianceLeadNumber.trim()}
                >
                  Delete + DNC
                </Button>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              `Delete + DNC` removes the lead from active pursuit and adds the number to Do-Not-Call immediately.
            </p>
          </div>

          <div className="space-y-8 pt-8 border-t border-zinc-800/50">
             <div className="flex items-center gap-3 px-2">
               <UserPlus className="w-5 h-5 text-orange-300" />
               <h3 className="text-lg font-bold text-zinc-100">Team Collaboration</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Input
                placeholder="Full Name"
                value={teamForm.name}
                onChange={e => setTeamForm((prev: any) => ({ ...prev, name: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
              />
              <Input
                placeholder="Work Email"
                value={teamForm.email}
                onChange={e => setTeamForm((prev: any) => ({ ...prev, email: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
              />
              <Input
                placeholder="Role (e.g. QA, Manager)"
                value={teamForm.role}
                onChange={e => setTeamForm((prev: any) => ({ ...prev, role: e.target.value }))}
                className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl"
              />
              <Button
                type="button"
                onClick={addTeamMember}
                disabled={teamLoading}
                className="bg-orange-400 hover:bg-orange-500 h-12 rounded-xl font-bold shadow-lg shadow-orange-400/10"
              >
                Invite Member
              </Button>
            </div>

            <div className="grid gap-3">
              {teamMembers.length === 0 ? (
                <div className="py-12 text-center border border-zinc-800 rounded-2xl bg-zinc-950/20">
                   <p className="text-xs text-zinc-600 font-medium">No team members added yet.</p>
                </div>
              ) : (
                teamMembers.map(member => (
                  <div key={member.id} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                          {member.name.charAt(0)}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-zinc-100">{member.name} <Badge variant="outline" className="ml-2 text-[8px] uppercase tracking-tighter border-zinc-800 text-zinc-500 font-bold">{member.role}</Badge></p>
                         <p className="text-xs text-zinc-500 font-medium">{member.email}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className={`h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest ${member.active ? 'text-orange-300 hover:bg-orange-400/5' : 'text-zinc-500'}`}
                        onClick={() => toggleTeamMember(member)}
                        disabled={teamLoading}
                      >
                        {member.active ? 'Active' : 'Inactive'}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg"
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
        </CardContent>
      </Card>
    </div>
  )
}
