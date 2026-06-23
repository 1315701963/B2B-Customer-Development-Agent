import type { Account, AgentRun, AgentRunDetail, Contact, OutreachSequence } from './types'

const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function listAccounts() {
  return request<Account[]>('/accounts')
}

export function getAccount(accountId: number) {
  return request<Account>(`/accounts/${accountId}`)
}

export function createRun(accountId: number, workflowName = 'phase5_full_workflow') {
  return request<AgentRun>(`/accounts/${accountId}/run`, {
    method: 'POST',
    body: JSON.stringify({ workflow_name: workflowName, trigger_source: 'manual' }),
  })
}

export function listRuns() {
  return request<AgentRun[]>('/runs')
}

export function listAccountRuns(accountId: number) {
  return request<AgentRun[]>(`/accounts/${accountId}/runs`)
}

export function getRun(runId: number) {
  return request<AgentRunDetail>(`/runs/${runId}`)
}

export function listContacts(accountId: number) {
  return request<Contact[]>(`/accounts/${accountId}/contacts`)
}

export function listOutreach(accountId: number) {
  return request<OutreachSequence[]>(`/accounts/${accountId}/outreach`)
}
