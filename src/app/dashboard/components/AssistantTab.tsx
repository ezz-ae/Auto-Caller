import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bot, RefreshCw, Send, MessageSquare } from "lucide-react"
import type { AgentAction } from '@/app/dashboard/types'

interface AssistantTabProps {
  activeAgentId: string | null
  activeAgentName: string
  activeAgentProfile: any
  workspaceAgents: any[]
  agentMessages: any[]
  agentInput: string
  setAgentInput: (input: string) => void
  askAgent: () => void
  agentLoading: boolean
  speakAgentMessage: (text: string) => void
  getActionLabel: (action?: AgentAction) => string
  setActiveAgentId: (id: string) => void
  setActiveTab: (tab: string) => void
  agentMessagesByAgent: any
  agentProfiles: any[]
  newAgentDraftNames: any
  setNewAgentDraftNames: React.Dispatch<React.SetStateAction<any>>
  startAgentSession: (profileId: string, name?: string) => void
}

export function AssistantTab({
  activeAgentId,
  activeAgentName,
  activeAgentProfile,
  workspaceAgents,
  agentMessages,
  agentInput,
  setAgentInput,
  askAgent,
  agentLoading,
  speakAgentMessage,
  getActionLabel,
  setActiveAgentId,
  setActiveTab,
  agentMessagesByAgent,
  agentProfiles,
  newAgentDraftNames,
  setNewAgentDraftNames,
  startAgentSession
}: AssistantTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Bot className="w-7 h-7 text-orange-400" />
                AI Assistant
              </CardTitle>
              <p className="text-base text-zinc-400">
                Chat with your workspace assistant to plan campaigns and analyze data.
              </p>
            </div>
            {activeAgentId && (
              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-4 py-1.5 rounded-full text-sm font-bold">
                {activeAgentName} Active
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex flex-col h-[700px]">
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-950/20">
              {!activeAgentId ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-zinc-700" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-200">No assistant active</h3>
                  <p className="text-sm text-zinc-500">
                    Select one of your assistants below or create a new one to start planning your outreach strategy.
                  </p>
                </div>
              ) : agentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-2">
                    <Bot className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-200">Hello! I&apos;m {activeAgentName}.</h3>
                  <p className="text-sm text-zinc-400">
                    I can help you plan campaigns, design outreach scripts, and review your lead outcomes. What should we work on today?
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" className="border-zinc-800 text-xs hover:bg-zinc-800" onClick={() => setAgentInput("Help me plan a real estate campaign.")}>
                      Plan real estate campaign
                    </Button>
                    <Button variant="outline" size="sm" className="border-zinc-800 text-xs hover:bg-zinc-800" onClick={() => setAgentInput("Show me my success rate for today.")}>
                      Check today&apos;s performance
                    </Button>
                  </div>
                </div>
              ) : (
                agentMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-zinc-800 text-zinc-100 rounded-tr-none' 
                        : 'bg-orange-500/10 border border-orange-500/20 text-zinc-200 rounded-tl-none'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">
                          {msg.role === 'user' ? 'You' : activeAgentName}
                        </p>
                        {msg.role === 'assistant' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 text-[10px] uppercase font-bold"
                            onClick={() => speakAgentMessage(msg.content)}
                          >
                            Listen
                          </Button>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.checklist && msg.checklist.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-orange-500/10 space-y-2">
                          <p className="text-[10px] uppercase font-bold text-orange-400 tracking-widest">Recommended Steps</p>
                          <ul className="space-y-1.5">
                            {msg.checklist.map((item: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                                <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {msg.action && msg.action !== 'none' && getActionLabel(msg.action) && (
                        <div className="mt-4 flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
                          <div className="space-y-0.5">
                             <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-tighter">Workspace Shortcut</p>
                             <p className="text-xs font-semibold text-orange-400">{getActionLabel(msg.action)}</p>
                          </div>
                          <Button size="sm" variant="secondary" className="h-8 bg-zinc-800 hover:bg-zinc-700 text-xs" onClick={() => setActiveTab(msg.action)}>
                             Go Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 bg-zinc-900 border-t border-zinc-800">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !agentLoading) {
                      e.preventDefault()
                      askAgent()
                    }
                  }}
                  placeholder={`Ask ${activeAgentName} anything...`}
                  className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl text-zinc-100 placeholder:text-zinc-600 px-6 focus-visible:ring-orange-500/50"
                  disabled={!activeAgentId}
                />
                <Button 
                  onClick={askAgent} 
                  disabled={agentLoading || !agentInput.trim() || !activeAgentId}
                  className="h-12 w-12 rounded-xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0"
                >
                  {agentLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">Available Assistants</CardTitle>
          <p className="text-sm text-zinc-400">Select an existing assistant or hire a new one for a specific task.</p>
        </CardHeader>
        <CardContent className="px-8 pb-8">
           <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {workspaceAgents.map(agent => {
                const profile = agentProfiles.find(item => item.id === agent.profileId)
                const historyCount = agentMessagesByAgent[agent.id]?.length || 0
                const isActive = agent.id === activeAgentId
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setActiveAgentId(agent.id)}
                    className={`relative rounded-2xl border p-5 text-left transition-all duration-300 group ${
                      isActive
                        ? 'border-orange-500/50 bg-orange-500/5 shadow-lg shadow-orange-500/5'
                        : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-900 text-zinc-600 group-hover:text-zinc-400'}`}>
                        <Bot className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase border-zinc-800 text-zinc-500">{historyCount} messages</Badge>
                    </div>
                    <p className="text-lg font-bold text-zinc-100">{agent.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {profile?.language} • {profile?.expertise}
                    </p>
                    {isActive && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    )}
                  </button>
                )
              })}
              
              <div className="col-span-full pt-6 border-t border-zinc-800 mt-2">
                 <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Hire a specialized assistant</h4>
                 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {agentProfiles.map(profile => (
                      <div key={profile.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/20 p-6 flex flex-col justify-between group hover:border-zinc-700 transition-colors">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                             <p className="text-lg font-bold text-zinc-200">{profile.name}</p>
                             <Badge className="bg-zinc-900 text-zinc-500 border-zinc-800 text-[10px] uppercase">{profile.style}</Badge>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{profile.expertise}</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-zinc-800/50 space-y-4">
                           <Input
                              value={newAgentDraftNames[profile.id] || ''}
                              onChange={e => setNewAgentDraftNames((prev: any) => ({ ...prev, [profile.id]: e.target.value }))}
                              placeholder={`Name for your ${profile.name}`}
                              className="bg-zinc-900/50 border-zinc-800 h-10 rounded-lg text-xs"
                           />
                           <Button
                              type="button"
                              variant="secondary"
                              className="w-full bg-zinc-800 hover:bg-zinc-700 h-10 rounded-lg text-xs font-bold"
                              onClick={() => startAgentSession(profile.id, newAgentDraftNames[profile.id] || '')}
                            >
                              Hire {profile.name}
                           </Button>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
