export type AgentAction =
  | 'none'
  | 'open_billing'
  | 'open_call'
  | 'open_callers'
  | 'open_settings'

export interface IntegrationActivityEvent {
  id: string
  source: string
  status: 'success' | 'warning' | 'error'
  message: string
  importedCount: number
  createdAt: string
}
