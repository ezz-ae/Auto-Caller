import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardList, RefreshCw, CalendarClock, Phone, Info } from "lucide-react"

interface LeadsTabProps {
  leadSearch: string
  setLeadSearch: (val: string) => void
  fetchCampaigns: () => void
  setActiveTab: (tab: string) => void
  filteredLeads: any[]
  formatDateTime: (date: string) => string
  contentInput: {
    offer: string
    goal: string
    notes: string
  }
  setContentInput: React.Dispatch<React.SetStateAction<{
    offer: string
    goal: string
    notes: string
  }>>
  submitContentInputToAgent: () => Promise<void>
  agentLoading: boolean
  leadLists: string[]
  selectedLeadList: string
  onSelectLeadList: (name: string) => void
  newLeadListName: string
  setNewLeadListName: (value: string) => void
  addLeadList: () => void
}

export function LeadsTab({
  leadSearch,
  setLeadSearch,
  fetchCampaigns,
  setActiveTab,
  filteredLeads,
  formatDateTime,
  contentInput,
  setContentInput,
  submitContentInputToAgent,
  agentLoading,
  leadLists,
  selectedLeadList,
  onSelectLeadList,
  newLeadListName,
  setNewLeadListName,
  addLeadList
}: LeadsTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-orange-500/5 overflow-hidden">
        <CardContent className="p-0">
           <div className="p-8 bg-zinc-950/50 border-b border-zinc-800/50 flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="space-y-1">
                 <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                    <ClipboardList className="w-7 h-7 text-orange-400" />
                    Lead Intelligence
                 </h2>
                 <p className="text-zinc-400 text-sm">Unified timeline and history for every contact in your workspace.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Input
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search by phone, name, or note..."
                    className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl pl-10 w-full sm:w-80 focus:ring-orange-500/30"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="bg-zinc-800 hover:bg-zinc-700 h-12 rounded-xl border border-zinc-700 font-bold"
                    onClick={fetchCampaigns}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="bg-zinc-800 hover:bg-zinc-700 h-12 rounded-xl border border-zinc-700 px-6 font-bold"
                    onClick={() => setActiveTab('callbacks')}
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Queue
                  </Button>
                </div>
              </div>
           </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
        <CardContent className="p-6 space-y-3">
          <p className="text-xs text-zinc-500">Lead context input</p>
          <div className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
            <Select value={selectedLeadList} onValueChange={onSelectLeadList}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select list" />
              </SelectTrigger>
              <SelectContent>
                {leadLists.map((list) => (
                  <SelectItem key={list} value={list}>
                    {list}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newLeadListName}
              onChange={(e) => setNewLeadListName(e.target.value)}
              placeholder="New lead list name"
              className="bg-zinc-800 border-zinc-700"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-zinc-800 hover:bg-zinc-700"
              onClick={addLeadList}
            >
              Add List
            </Button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              value={contentInput.offer}
              onChange={(e) => setContentInput(prev => ({ ...prev, offer: e.target.value }))}
              placeholder="Offer"
              className="bg-zinc-800 border-zinc-700"
            />
            <Input
              value={contentInput.goal}
              onChange={(e) => setContentInput(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="Goal"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <Textarea
            value={contentInput.notes}
            onChange={(e) => setContentInput(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Lead notes, rules, and expected report output"
            className="min-h-[90px] bg-zinc-800 border-zinc-700 text-sm"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-zinc-800 hover:bg-zinc-700"
              onClick={() => void submitContentInputToAgent()}
              disabled={agentLoading}
            >
              Send To Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-zinc-800 rounded-[32px] space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
               <ClipboardList className="w-10 h-10 text-zinc-700" />
            </div>
            <div className="space-y-2">
               <p className="text-xl font-bold text-zinc-400">No lead intelligence yet.</p>
               <p className="text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">As your agents connect with leads, their full timelines, feedback, and engagement quality will appear here.</p>
            </div>
            <Button size="lg" className="rounded-2xl h-14 px-8 font-bold bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/10" onClick={() => setActiveTab('call')}>
               Launch First Campaign
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.slice(0, 100).map((lead: any) => (
              <Card key={lead.phoneNumber} className="bg-zinc-900 border-zinc-800 shadow-lg hover:border-zinc-700 transition-all duration-300 group overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-zinc-100 group-hover:text-orange-400 transition-colors tracking-tight">{lead.phoneNumber}</p>
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium uppercase tracking-tighter">
                              <span>First Seen:</span>
                              <span className="text-zinc-400">{formatDateTime(lead.firstSeenAt)}</span>
                           </div>
                           <div className="w-1 h-1 rounded-full bg-zinc-800" />
                           <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium uppercase tracking-tighter">
                              <span>Last Activity:</span>
                              <span className="text-zinc-400">{formatDateTime(lead.lastActivityAt)}</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] uppercase font-bold py-1.5 px-3">Total Calls: {lead.totalCalls}</Badge>
                        <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] uppercase font-bold py-1.5 px-3">Connected: {lead.connectedCalls}</Badge>
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] uppercase font-bold py-1.5 px-3">No Answer: {lead.noAnswerCalls}</Badge>
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] uppercase font-bold py-1.5 px-3">Failed: {lead.failedCalls}</Badge>
                      </div>
                    </div>

                    {(lead.latestUserComment || lead.latestTargetComment || lead.latestCallComment || lead.latestLeadSummary) && (
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 space-y-4">
                        <div className="flex items-center gap-2">
                           <Info className="w-4 h-4 text-orange-400" />
                           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Latest intelligence</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                           {lead.latestLeadSummary && (
                             <div className="space-y-1">
                                <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter">Lead Context</p>
                                <p className="text-sm text-zinc-200 leading-relaxed font-medium italic">"{lead.latestLeadSummary}"</p>
                             </div>
                           )}
                           {lead.latestCallComment && (
                             <div className="space-y-1">
                                <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter">Agent Feedback</p>
                                <p className="text-sm text-zinc-300 leading-relaxed font-medium">{lead.latestCallComment}</p>
                             </div>
                           )}
                        </div>
                      </div>
                    )}

                    <details className="group">
                      <summary className="cursor-pointer flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors py-2">
                        <div className="w-5 h-5 rounded-full border border-zinc-800 flex items-center justify-center group-open:rotate-180 transition-transform">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        Lead Timeline ({lead.timeline.length} Events)
                      </summary>
                      <div className="mt-6 space-y-3 pl-7 border-l border-zinc-800 ml-2.5">
                        {lead.timeline.slice(0, 20).map((item: any, index: number) => (
                          <div key={`${item.campaignId}-${item.timestamp}-${index}`} className="relative">
                            <div className="absolute -left-[33px] top-3 w-3 h-3 rounded-full bg-zinc-900 border-2 border-zinc-800 group-hover:border-orange-500/50 transition-colors" />
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3 hover:bg-zinc-800/50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="text-sm font-bold text-zinc-200">
                                  {item.campaignName} • <span className="text-orange-400">{item.status}</span>
                                </p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{formatDateTime(item.timestamp)}</p>
                              </div>
                              {item.callComment && <p className="text-xs text-zinc-400 leading-relaxed font-medium">Feedback: {item.callComment}</p>}
                              {item.leadSummary && <p className="text-xs text-zinc-400 leading-relaxed font-medium">Summary: {item.leadSummary}</p>}
                              {item.followUpAt && (
                                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                   <CalendarClock className="w-3 h-3 text-amber-400" />
                                   <p className="text-[10px] font-bold text-amber-200 uppercase tracking-tighter">
                                     Callback: {formatDateTime(item.followUpAt)} ({item.followUpStatus || 'scheduled'})
                                   </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
