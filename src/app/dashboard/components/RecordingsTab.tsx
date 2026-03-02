import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  Mic, 
  RefreshCw, 
  MessageSquare, 
  Play, 
  Square, 
  Download, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  TrendingUp 
} from "lucide-react"

interface RecordingsTabProps {
  recordingSearch: string
  setRecordingSearch: (val: string) => void
  fetchRecordings: () => void
  recordings: any[]
  filteredRecordings: any[]
  selectedRecording: any
  setSelectedRecording: (rec: any) => void
  playRecording: (url: string, id: string) => void
  playingRecording: string | null
  transcribeRecording: (id: string) => void
  transcribing: string | null
  getSentimentColor: (sentiment?: string) => string
}

export function RecordingsTab({
  recordingSearch,
  setRecordingSearch,
  fetchRecordings,
  recordings,
  filteredRecordings,
  selectedRecording,
  setSelectedRecording,
  playRecording,
  playingRecording,
  transcribeRecording,
  transcribing,
  getSentimentColor
}: RecordingsTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-cyan-500/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Input
                    value={recordingSearch}
                    onChange={(e) => setRecordingSearch(e.target.value)}
                    placeholder="Search conversations, summaries, or keywords..."
                    className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl pl-10 focus:ring-cyan-500/30"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <Mic className="w-4 h-4 text-zinc-500" />
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="bg-zinc-800 hover:bg-zinc-700 h-12 rounded-xl border border-zinc-700 font-bold"
                  onClick={fetchRecordings}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {recordings.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-3xl space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-2">
                   <Mic className="w-8 h-8 text-zinc-700" />
                </div>
                <p className="text-zinc-500 font-medium">No outreach recordings yet.</p>
                <p className="text-xs text-zinc-600 max-w-xs mx-auto leading-relaxed">Launch a campaign to start capturing intelligent call records with full transcript analysis.</p>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="py-20 text-center border border-zinc-800 rounded-2xl">
                <MessageSquare className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">No recordings match your search criteria.</p>
              </div>
            ) : (
              filteredRecordings.map((recording) => (
                <Card
                  key={recording.id}
                  className={`bg-zinc-900 border-zinc-800 overflow-hidden transition-all duration-300 ${selectedRecording?.id === recording.id ? 'ring-2 ring-cyan-500/30 border-cyan-500/20' : 'hover:border-zinc-700'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-stretch">
                    <button
                      type="button"
                      onClick={() => setSelectedRecording(recording)}
                      className="flex-1 text-left p-6 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedRecording?.id === recording.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'}`}>
                          <Mic className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-zinc-100">{recording.phoneNumber}</p>
                          <div className="flex flex-wrap items-center gap-2">
                             <p className="text-xs text-zinc-500 font-medium uppercase tracking-tighter">{new Date(recording.createdAt).toLocaleDateString()} • {new Date(recording.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                             <div className="w-1 h-1 rounded-full bg-zinc-800" />
                             <p className="text-xs text-zinc-500 font-bold">{recording.duration}s Session</p>
                          </div>
                        </div>
                      </div>
                      
                      {recording.transcript?.summary && (
                         <div className="mt-4 pl-16">
                            <p className="text-sm text-zinc-400 line-clamp-2 italic leading-relaxed border-l-2 border-cyan-500/20 pl-4">
                               "{recording.transcript.summary}"
                            </p>
                         </div>
                      )}
                    </button>

                    <div className="flex md:flex-col items-center justify-center gap-1 p-4 md:border-l border-zinc-800 bg-zinc-950/20 w-full md:w-16">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => playRecording(recording.recordingUrl, recording.id)}
                        className={`h-10 w-10 rounded-xl ${playingRecording === recording.id ? 'bg-cyan-500/10 text-cyan-400' : 'text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/5'}`}
                      >
                        {playingRecording === recording.id ? (
                          <Square className="w-4 h-4 fill-cyan-400" />
                        ) : (
                          <Play className="w-5 h-5 fill-zinc-500 group-hover:fill-cyan-400 transition-colors" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => transcribeRecording(recording.id)}
                        disabled={transcribing === recording.id || !!recording.transcript}
                        className={`h-10 w-10 rounded-xl ${recording.transcript ? 'text-cyan-400 opacity-50' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                      >
                        {transcribing === recording.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-10 w-10 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800"
                      >
                        <a href={recording.recordingUrl} download>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {selectedRecording?.id === recording.id && recording.transcript && (
                    <div className="p-8 bg-zinc-950/40 border-t border-zinc-800 space-y-8 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid gap-6 md:grid-cols-2">
                        {recording.transcript.summary && (
                          <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">AI Summary</span>
                              </div>
                              {recording.transcript.sentiment && (
                                <Badge className={`${getSentimentColor(recording.transcript.sentiment)} text-[10px] uppercase font-bold tracking-tighter`}>
                                  {recording.transcript.sentiment} Tone
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-zinc-200 leading-relaxed font-medium">{recording.transcript.summary}</p>
                          </div>
                        )}

                        <div className="space-y-6">
                          {recording.transcript.keywords && recording.transcript.keywords.length > 0 && (
                            <div className="space-y-2">
                               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Key Concepts</p>
                               <div className="flex flex-wrap gap-2">
                                  {recording.transcript.keywords.map((keyword: string, i: number) => (
                                    <Badge key={i} variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-400 text-[10px] py-1 px-2.5">
                                      {keyword}
                                    </Badge>
                                  ))}
                               </div>
                            </div>
                          )}
                          
                          {recording.transcript.actionItems && recording.transcript.actionItems.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Action Items</span>
                              </div>
                              <ul className="space-y-2">
                                {recording.transcript.actionItems.map((item: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                                     <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                     {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                         <details className="group">
                           <summary className="cursor-pointer flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800 transition-colors">
                              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Conversation Transcript</span>
                              <div className="text-zinc-600 group-open:rotate-180 transition-transform">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                              </div>
                           </summary>
                           <div className="mt-4 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-400 leading-[1.8] max-h-[400px] overflow-y-auto whitespace-pre-wrap font-medium">
                              {recording.transcript.text}
                           </div>
                         </details>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
        
        <div className="space-y-8">
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden border-cyan-500/5">
            <CardHeader className="pb-6 bg-zinc-950/50 border-b border-zinc-800/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Intelligence Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-8 px-8 pb-8">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Total Analysis</span>
                  <span className="text-zinc-200">{filteredRecordings.length} Recordings</span>
                </div>
                <div className="flex justify-between items-baseline gap-2 mt-4">
                   <p className="text-3xl font-bold text-white">{recordings.filter(r => r.transcript).length}</p>
                   <p className="text-xs font-bold text-cyan-400 uppercase">AI-Processed</p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Global Outreach Duration</span>
                    <span className="text-sm font-bold text-zinc-100">{Math.round(recordings.reduce((sum, r) => sum + (r.duration || 0), 0) / 60)}m</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Success Rate (Connected)</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {recordings.length > 0 ? Math.round((recordings.filter(r => r.duration > 5).length / recordings.length) * 100) : 0}%
                    </span>
                 </div>
              </div>
            </CardContent>
          </Card>
          
          {selectedRecording && (
            <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden border-cyan-500/10 sticky top-24 animate-in fade-in zoom-in-95 duration-300">
              <CardHeader className="pb-6 bg-cyan-500/5 border-b border-cyan-500/10">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                   <Sparkles className="w-5 h-5 text-cyan-400" />
                   Call Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 px-8 pb-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between group">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Target Line</span>
                    <span className="text-sm font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">{selectedRecording.phoneNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Duration</span>
                    <span className="text-sm font-bold text-zinc-100">{selectedRecording.duration}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Sentiment Score</span>
                    <Badge className={`${getSentimentColor(selectedRecording.transcript?.sentiment)} text-[10px] uppercase font-bold tracking-tighter`}>
                      {selectedRecording.transcript?.sentiment || 'Processing'}
                    </Badge>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Intelligent Observation</p>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    {selectedRecording.transcript?.summary || 'No summary available yet. Run transcription to generate deep intelligence for this outreach attempt.'}
                  </p>
                </div>

                <Button 
                   className="w-full bg-zinc-800 hover:bg-zinc-700 h-12 rounded-xl font-bold border border-zinc-700"
                   onClick={() => setSelectedRecording(null)}
                >
                   Close Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
