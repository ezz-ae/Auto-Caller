import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  Sparkles, 
  MessageSquare, 
  Users, 
  Wallet, 
  CalendarClock, 
  Phone, 
  BarChart3, 
  TimerReset, 
  Bot 
} from "lucide-react"
import type { WorkspaceIntelligence } from '@/lib/call-center-intelligence'

interface OverviewTabProps {
  startSteps: any[]
  setActiveTab: (tab: string) => void
  readinessScore: number
  readinessItems: any[]
  connectedCalls: number
  totalCalls: number
  totalNumbersQueued: number
  successRate: number
  currentCampaign: any
  stats: any
  credits: number
  managedMode: boolean
  callerNumbersActive: number
  callerIdentities: any[]
  callbacksScheduled: number
  callbacksDueNow: number
  dailyReport: any
  workspaceIntelligence: any
  getIntelligenceStatusTone: (status: WorkspaceIntelligence['status']) => string
  getPriorityTone: (priority: 'high' | 'medium' | 'low') => string
}

export function OverviewTab({
  startSteps,
  setActiveTab,
  readinessScore,
  readinessItems,
  connectedCalls,
  totalCalls,
  totalNumbersQueued,
  successRate,
  currentCampaign,
  stats,
  credits,
  managedMode,
  callerNumbersActive,
  callerIdentities,
  callbacksScheduled,
  callbacksDueNow,
  dailyReport,
  workspaceIntelligence,
  getIntelligenceStatusTone,
  getPriorityTone
}: OverviewTabProps) {
  const hasPerformanceData = totalCalls > 0 || connectedCalls > 0
  const hasDailyData =
    dailyReport.totalCalls > 0 ||
    dailyReport.connectedCalls > 0 ||
    dailyReport.followUpsScheduled > 0 ||
    dailyReport.leadsTouched > 0
  const showResourceCard = credits > 0 || callerNumbersActive > 0 || callerIdentities.length > 0
  const summaryCardsCount =
    (hasPerformanceData ? 1 : 0) + (currentCampaign ? 1 : 0) + (showResourceCard ? 1 : 0)

  return (
    <div className="space-y-10 animate-in fade-in-50 duration-200">
      <div className="grid gap-8 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Target className="w-7 h-7 text-emerald-400" />
                  Launch Checklist
                </CardTitle>
                <CardDescription className="text-base text-zinc-400">
                  Follow these simple steps to get your first campaign live.
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">{readinessScore}% Complete</p>
                <Progress value={readinessScore} className="h-1.5 w-32 mt-2 bg-zinc-800" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {startSteps.map((step, index) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setActiveTab(step.tab)}
                  className="group relative rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 text-left hover:border-emerald-500/30 hover:bg-zinc-900/50 transition-all duration-300"
                >
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Step {index + 1}</p>
                  <p className="text-base text-zinc-200 mt-2 font-semibold group-hover:text-emerald-400 transition-colors">{step.label}</p>
                  <Badge className={`mt-4 ${step.done ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {step.done ? 'Completed' : 'Action Required'}
                  </Badge>
                </button>
              ))}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {readinessItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setActiveTab(item.tab)}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/20 p-4 text-left hover:border-zinc-700 transition"
                >
                  <span className="text-sm text-zinc-300 font-medium">{item.label}</span>
                  {item.ready ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-tighter">Active</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px] uppercase tracking-tighter">Setup Needed</Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-lg border-emerald-500/5">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-8">
            <Button
              variant="secondary"
              className="w-full justify-start bg-zinc-800/50 hover:bg-zinc-800 h-12 rounded-xl border border-zinc-700/50"
              onClick={() => setActiveTab('agents')}
            >
              <MessageSquare className="w-4 h-4 mr-3 text-emerald-400" />
              Chat with Assistant
            </Button>
            <Button 
              variant="secondary" 
              className="w-full justify-start bg-zinc-800/50 hover:bg-zinc-800 h-12 rounded-xl border border-zinc-700/50" 
              onClick={() => setActiveTab('callers')}
            >
              <Users className="w-4 h-4 mr-3 text-emerald-400" />
              Manage Voice Agents
            </Button>
            <Button 
              variant="secondary" 
              className="w-full justify-start bg-zinc-800/50 hover:bg-zinc-800 h-12 rounded-xl border border-zinc-700/50" 
              onClick={() => setActiveTab('billing')}
            >
              <Wallet className="w-4 h-4 mr-3 text-emerald-400" />
              Recharge Credits
            </Button>
            <Button 
              variant="secondary" 
              className="w-full justify-start bg-zinc-800/50 hover:bg-zinc-800 h-12 rounded-xl border border-zinc-700/50" 
              onClick={() => setActiveTab('callbacks')}
            >
              <CalendarClock className="w-4 h-4 mr-3 text-emerald-400" />
              Review Schedule
            </Button>
            <Button 
              className="w-full justify-start h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20" 
              onClick={() => setActiveTab('call')}
            >
              <Phone className="w-5 h-5 mr-3" />
              <span className="text-lg font-semibold">Start New Campaign</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {summaryCardsCount > 0 && (
      <div className="grid gap-8 lg:grid-cols-3">
        {hasPerformanceData && (
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Connected Calls</span>
              <span className="font-bold text-white">{connectedCalls}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Completed Calls</span>
              <span className="font-bold text-white">{totalCalls}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Success Rate</span>
              <span className="text-xl font-bold text-emerald-400">{successRate}%</span>
            </div>
            <div className="pt-4 border-t border-zinc-800">
               <Progress value={successRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
        )}

        {currentCampaign && (
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Phone className="w-5 h-5 text-emerald-400" />
              Active Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentCampaign ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{currentCampaign.name}</p>
                  <p className="text-xs text-zinc-500 mt-1 uppercase tracking-tighter">Status: {currentCampaign.status}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Progress</span>
                    <span>{stats.connected + stats.failed} / {stats.total}</span>
                  </div>
                  <Progress value={stats.total > 0 ? ((stats.connected + stats.failed) / stats.total) * 100 : 0} className="h-1.5" />
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-zinc-500">No active campaign</p>
                <Button variant="link" className="text-emerald-400 text-xs mt-2" onClick={() => setActiveTab('call')}>
                  Launch one now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {showResourceCard && (
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Resource Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Available Credits</span>
              <span className="text-xl font-bold text-emerald-400">{credits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Active Lines</span>
              <span className="font-semibold">{callerNumbersActive} / {callerIdentities.length}</span>
            </div>
            <div className="pt-4 border-t border-zinc-800">
               <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-800 hover:text-white" onClick={() => setActiveTab('billing')}>
                 Add Credits
               </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
      )}

      <div className={`grid gap-8 ${hasDailyData ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {hasDailyData && (
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-emerald-500/5">
          <CardHeader className="pb-8">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              How are we doing today?
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Your daily outreach performance summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Calls</p>
                <p className="text-2xl font-bold text-white">{dailyReport.totalCalls}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Connected</p>
                <p className="text-2xl font-bold text-emerald-400">{dailyReport.connectedCalls}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Follow-ups</p>
                <p className="text-2xl font-bold text-white">{dailyReport.followUpsScheduled}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-2">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Leads</p>
                <p className="text-2xl font-bold text-white">{dailyReport.leadsTouched}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full bg-zinc-800/80 hover:bg-zinc-800 h-12 rounded-xl"
              onClick={() => setActiveTab('callbacks')}
            >
              Review Daily Queue
            </Button>
          </CardContent>
        </Card>
        )}

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-emerald-500/10">
          <CardHeader className="pb-8">
            <CardTitle className="text-xl flex items-center gap-2">
              <Bot className="w-6 h-6 text-emerald-400" />
              Smart Insights
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Intelligent observations to help you optimize.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Workspace Health</p>
                <p className="text-2xl font-bold text-zinc-100">{workspaceIntelligence.healthScore}%</p>
              </div>
              <Badge className={`${getIntelligenceStatusTone(workspaceIntelligence.status)} py-1 px-3 text-xs uppercase tracking-tighter`}>
                {workspaceIntelligence.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500/50 pl-4">
              "{workspaceIntelligence.summary}"
            </p>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Suggested Actions</p>
              <div className="space-y-2">
                {workspaceIntelligence.nextActions.map((action: any) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => setActiveTab(action.tab)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-left hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">{action.title}</p>
                      <Badge className={`${getPriorityTone(action.priority)} text-[10px] uppercase`}>{action.priority}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{action.detail}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
