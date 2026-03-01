import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarClock, RefreshCw, Phone, Info } from "lucide-react"

interface CallbacksTabProps {
  callbackFilter: string
  setCallbackFilter: (val: string) => void
  loadScheduledCallbacksToComposer: () => void
  fetchCampaigns: () => void
  filteredCallbacks: any[]
  campaigns: any[]
  loadCampaignToComposer: (campaign: any) => void
  formatDateTime: (date: string) => string
  setActiveTab: (tab: string) => void
  callbacksScheduled: number
  callbacksDueNow: number
  dailyReport: any
}

export function CallbacksTab({
  callbackFilter,
  setCallbackFilter,
  loadScheduledCallbacksToComposer,
  fetchCampaigns,
  filteredCallbacks,
  campaigns,
  loadCampaignToComposer,
  formatDateTime,
  setActiveTab,
  callbacksScheduled,
  callbacksDueNow,
  dailyReport
}: CallbacksTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-emerald-500/5">
            <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <CalendarClock className="w-7 h-7 text-emerald-400" />
                    Callback Queue
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Automated follow-ups based on real conversation triggers.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={callbackFilter} onValueChange={(value) => setCallbackFilter(value)}>
                    <SelectTrigger className="w-full sm:w-48 bg-zinc-800/50 border-zinc-700 h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="secondary"
                    className="bg-zinc-800 hover:bg-zinc-700 h-11 rounded-xl border border-zinc-700 font-bold"
                    onClick={fetchCampaigns}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-8 pb-8 space-y-6">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                 <div className="space-y-1">
                    <p className="text-base font-semibold text-zinc-100">Load Scheduled to Call Center</p>
                    <p className="text-xs text-zinc-500">Automatically move all "Due Now" and "Scheduled" tasks into a campaign.</p>
                 </div>
                 <Button
                    className="bg-emerald-500 hover:bg-emerald-600 h-12 rounded-xl px-8 font-bold shadow-lg shadow-emerald-500/10"
                    onClick={loadScheduledCallbacksToComposer}
                  >
                    Load Outreach Queue
                  </Button>
              </div>

              <div className="space-y-4">
                {filteredCallbacks.length === 0 ? (
                  <div className="py-24 text-center border border-zinc-800 rounded-3xl space-y-4 bg-zinc-950/20">
                    <CalendarClock className="w-12 h-12 mx-auto mb-2 text-zinc-800" />
                    <p className="text-zinc-500 font-medium">Your callback queue is clear.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredCallbacks.map((task: any, index: number) => {
                      const followUpCampaign = task.followUpCampaignId
                        ? campaigns.find(campaign => campaign.id === task.followUpCampaignId)
                        : null
                      return (
                        <div key={`${task.phoneNumber}-${task.callbackAt}-${index}`} className="group rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 hover:border-zinc-700 transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-zinc-500" />
                                 </div>
                                 <div>
                                    <p className="text-lg font-bold text-zinc-100">{task.phoneNumber}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                      Originated from: {task.parentCampaignName}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                                    <CalendarClock className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Due {formatDateTime(task.callbackAt)}</span>
                                 </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <Badge
                                className={`h-8 px-4 rounded-lg text-[10px] uppercase font-bold tracking-widest ${
                                  task.status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : task.status === 'cancelled'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {task.status}
                              </Badge>
                              {followUpCampaign && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="h-9 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold border border-zinc-700 px-4"
                                  onClick={() => loadCampaignToComposer(followUpCampaign)}
                                >
                                  Open Linked Campaign
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {(task.reason || task.targetComment || task.userComment || task.callComment) && (
                            <div className="mt-6 pt-6 border-t border-zinc-800/50 space-y-4">
                               {task.reason && (
                                 <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter">Callback Reason</p>
                                    <p className="text-sm text-zinc-200 font-medium leading-relaxed italic">"{task.reason}"</p>
                                 </div>
                               )}
                               <div className="grid gap-4 md:grid-cols-2">
                                  {task.callComment && (
                                    <div className="space-y-1">
                                       <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter">Last Conversation Feedback</p>
                                       <p className="text-xs text-zinc-400 font-medium leading-relaxed">{task.callComment}</p>
                                    </div>
                                  )}
                               </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden border-emerald-500/5">
            <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
              <CardTitle className="text-lg font-bold">Queue Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-8 pb-8 space-y-6">
              <div className="grid gap-4">
                 <div className="flex justify-between items-center group">
                    <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Total Scheduled</span>
                    <span className="text-lg font-bold text-white">{callbacksScheduled}</span>
                 </div>
                 <div className="flex justify-between items-center group">
                    <span className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Immediate Priority</span>
                    <span className="text-lg font-bold text-amber-400">{callbacksDueNow}</span>
                 </div>
                 <div className="pt-4 border-t border-zinc-800 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-zinc-600 uppercase font-bold tracking-widest">Completed Today</span>
                       <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{dailyReport.followUpsCompleted}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-zinc-600 uppercase font-bold tracking-widest">Cancelled Today</span>
                       <Badge className="bg-red-500/10 text-red-400 border-red-500/20">{dailyReport.followUpsCancelled}</Badge>
                    </div>
                 </div>
              </div>
              
              <Button 
                className="w-full h-14 rounded-2xl bg-zinc-800 hover:bg-zinc-700 font-bold border border-zinc-700 mt-4" 
                onClick={() => setActiveTab('call')}
              >
                Go to Call Center
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex items-start gap-4">
             <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
             <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Callbacks are automatically identified by our AI during live calls. If a lead asks to be called back later, it appears here instantly.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
