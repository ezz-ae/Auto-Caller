import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, Phone, Calendar, ArrowRight } from "lucide-react"

interface HistoryTabProps {
  campaigns: any[]
  loadCampaignToComposer: (campaign: any) => void
}

export function HistoryTab({
  campaigns,
  loadCampaignToComposer
}: HistoryTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-cyan-500/5 overflow-hidden">
        <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
           <div className="space-y-1">
              <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                 <History className="w-7 h-7 text-cyan-400" />
                 Campaign History
              </h2>
              <p className="text-zinc-400 text-sm">Review your past outreach efforts and reuse high-performing configurations.</p>
           </div>
        </CardHeader>
        <CardContent className="p-8">
          {campaigns.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-[32px] space-y-4">
              <History className="w-12 h-12 text-zinc-800 mx-auto" />
              <p className="text-zinc-500 font-medium">No historical campaigns found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <div 
                  key={campaign.id} 
                  className="group rounded-[24px] border border-zinc-800 bg-zinc-950/40 p-8 hover:border-zinc-700 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                           <Phone className="w-6 h-6 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <div className="space-y-1">
                           <h3 className="text-xl font-bold text-zinc-100">{campaign.name}</h3>
                           <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                 <Calendar className="w-3 h-3" />
                                 {new Date(campaign.createdAt).toLocaleDateString()}
                              </div>
                              <div className="w-1 h-1 rounded-full bg-zinc-800" />
                              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                 {campaign.numbers?.length || 0} Targets
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`h-9 px-4 rounded-xl text-[10px] uppercase font-bold tracking-widest ${
                          campaign.status === 'completed' 
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {campaign.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-10 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold border border-zinc-700"
                        onClick={() => loadCampaignToComposer(campaign)}
                      >
                        Reuse Strategy
                      </Button>
                    </div>
                  </div>

                  {(campaign.results || []).length > 0 && (
                    <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-4">
                       <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Sample Outcomes</p>
                       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {(campaign.results || []).slice(0, 6).map((result: any) => (
                            <div key={result.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3 hover:bg-zinc-900 transition-colors">
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-sm font-bold text-zinc-200">{result.phoneNumber}</p>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-zinc-800 text-zinc-500 font-bold">{result.status}</Badge>
                              </div>
                              {result.leadSummary && (
                                <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-2">"{result.leadSummary}"</p>
                              )}
                              {result.followUpRequested && result.followUpAt && (
                                <div className="mt-2 text-[9px] font-bold text-amber-300 uppercase tracking-tighter flex items-center gap-1.5">
                                   <div className="w-1 h-1 rounded-full bg-amber-400" />
                                   Callback Set
                                </div>
                              )}
                            </div>
                          ))}
                       </div>
                       {(campaign.results || []).length > 6 && (
                         <div className="pt-2 px-2 flex items-center justify-between">
                            <p className="text-[10px] text-zinc-600 font-medium">Showing 6 of {campaign.results.length} total outreach attempts</p>
                            <Button variant="link" className="text-cyan-500 text-xs h-auto p-0 font-bold group/btn" onClick={() => loadCampaignToComposer(campaign)}>
                               See All in Analytics <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
