import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Download, RefreshCw, Upload, Settings, Info } from "lucide-react"
import type { IntegrationActivityEvent } from '@/app/dashboard/types'

interface LeadSourcesTabProps {
  leadSourceSettings: any
  setLeadSourceSettings: React.Dispatch<React.SetStateAction<any>>
  copyWebhookUrl: () => void
  rotateZapierWebhookKey: () => void
  savingLeadSources: boolean
  loadingLeadInbox: boolean
  pullLeadInboxToComposer: () => void
  syncGoogleDriveLeads: () => void
  syncingGoogleDrive: boolean
  saveLeadSourcesConfig: () => void
  integrationEvents: any[]
  getIntegrationStatusTone: (status: IntegrationActivityEvent['status']) => string
}

export function LeadSourcesTab({
  leadSourceSettings,
  setLeadSourceSettings,
  copyWebhookUrl,
  rotateZapierWebhookKey,
  savingLeadSources,
  loadingLeadInbox,
  pullLeadInboxToComposer,
  syncGoogleDriveLeads,
  syncingGoogleDrive,
  saveLeadSourcesConfig,
  integrationEvents,
  getIntegrationStatusTone
}: LeadSourcesTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in-50 duration-200">
      <div className="grid gap-8 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                 <Download className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                  <CardTitle className="text-2xl font-bold">Automated Inbound</CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">Connect your lead forms and CRM directly to your outreach engine.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-10 pt-8 px-8 pb-8">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800">
              <div className="space-y-1">
                <p className="text-base font-semibold text-zinc-100">Enable Webhook Imports</p>
                <p className="text-sm text-zinc-500">Automatically capture leads from Zapier, Make, or Facebook Forms.</p>
              </div>
              <Switch
                checked={leadSourceSettings.zapierEnabled}
                onCheckedChange={checked => setLeadSourceSettings((prev: any) => ({ ...prev, zapierEnabled: checked }))}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Your Private Webhook URL</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={leadSourceSettings.zapierWebhookUrl}
                  readOnly
                  className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl text-zinc-300 font-mono text-xs focus:ring-blue-500/50 flex-1"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 h-12 rounded-xl border border-zinc-700" onClick={copyWebhookUrl}>
                    <Upload className="w-4 h-4 mr-2 text-blue-400" />
                    Copy
                  </Button>
                  <Button type="button" variant="ghost" className="text-zinc-500 hover:text-zinc-300 h-12 rounded-xl" onClick={rotateZapierWebhookKey} disabled={savingLeadSources}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 space-y-4">
               <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recommended Data Schema</p>
               <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                     <p className="text-xs text-zinc-300"><span className="text-zinc-500 font-mono">phone</span>: Target number (Required)</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                     <p className="text-xs text-zinc-300"><span className="text-zinc-500 font-mono">name</span>: Lead full name</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                     <p className="text-xs text-zinc-300"><span className="text-zinc-500 font-mono">email</span>: Contact email</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                     <p className="text-xs text-zinc-300"><span className="text-zinc-500 font-mono">source</span>: Lead origin</p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="pb-8">
            <CardTitle className="text-xl">Intelligence Inbox</CardTitle>
            <CardDescription>Review and import your synced leads into the Call Center.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-center space-y-2 group hover:border-orange-500/20 transition-all">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest group-hover:text-orange-400 transition-colors">New Leads</p>
                <p className="text-4xl font-bold text-orange-400">{leadSourceSettings.inboxNewCount}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-center space-y-2 group hover:border-zinc-700 transition-all">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Imported</p>
                <p className="text-4xl font-bold text-zinc-200">{leadSourceSettings.inboxConsumedCount}</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl shadow-orange-500/10"
                onClick={pullLeadInboxToComposer}
                disabled={loadingLeadInbox || leadSourceSettings.inboxNewCount === 0}
              >
                <Download className="w-6 h-6 mr-3" />
                {loadingLeadInbox ? 'Importing...' : 'Load Into Call Center'}
              </Button>
              <p className="text-xs text-center text-zinc-500 leading-relaxed px-4">
                This will move all "New" leads into your active campaign draft for immediate outreach.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden border-blue-500/5">
          <CardHeader className="pb-8 bg-zinc-950/50 border-b border-zinc-800/50">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                 <RefreshCw className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                  <CardTitle className="text-xl font-bold">Cloud Document Sync</CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">Automatically import leads from Google Sheets or public CSV links.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 px-8 pb-8">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800">
              <div className="space-y-1">
                <p className="text-base font-semibold text-zinc-100">Live Drive Sync</p>
                <p className="text-sm text-zinc-500">Keep this on to allow recurring sync tasks.</p>
              </div>
              <Switch
                checked={leadSourceSettings.googleDriveEnabled}
                onCheckedChange={checked => setLeadSourceSettings((prev: any) => ({ ...prev, googleDriveEnabled: checked }))}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Public CSV / Google Sheet URL</Label>
              <Input
                value={leadSourceSettings.googleDriveCsvUrl}
                onChange={e => setLeadSourceSettings((prev: any) => ({ ...prev, googleDriveCsvUrl: e.target.value }))}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="bg-zinc-800/50 border-zinc-700 h-12 rounded-xl text-zinc-300 px-6"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Button type="button" variant="secondary" className="h-12 rounded-xl px-8 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" onClick={saveLeadSourcesConfig} disabled={savingLeadSources}>
                <Settings className="w-4 h-4 mr-2" />
                {savingLeadSources ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button type="button" className="h-12 rounded-xl px-10 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 font-bold" onClick={syncGoogleDriveLeads} disabled={syncingGoogleDrive}>
                <RefreshCw className={`w-4 h-4 mr-2 ${syncingGoogleDrive ? 'animate-spin' : ''}`} />
                {syncingGoogleDrive ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl border-blue-500/5">
           <CardHeader className="pb-6">
              <CardTitle className="text-lg">Recent Sync Activity</CardTitle>
           </CardHeader>
           <CardContent className="px-6 pb-6">
              {integrationEvents.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-8 text-center space-y-4">
                   <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mx-auto">
                      <Info className="w-5 h-5 text-zinc-700" />
                   </div>
                   <p className="text-xs text-zinc-500 leading-relaxed font-medium">No activity yet. Your incoming lead events will appear here once configured.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {integrationEvents.slice(0, 10).map(event => (
                    <div key={event.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                         <p className="text-xs font-bold text-zinc-200">{event.message}</p>
                         <Badge className={`${getIntegrationStatusTone(event.status)} text-[9px] uppercase tracking-tighter`}>{event.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                         <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{event.source}</p>
                         <p className="text-[10px] text-zinc-600">{new Date(event.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
           </CardContent>
        </Card>
      </div>
    </div>
  )
}
