export interface Account {
  id: number;
  company_name: string;
  domain: string;
  source: string;
  status: string;
  notes: string | null;
  research_summary: string | null;
  icp_label: string | null;
  icp_confidence: string | null;
  intent_score: number | null;
  intent_label: string | null;
  handoff_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: number;
  account_id: number;
  workflow_name: string;
  status: string;
  trigger_source: string;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface AgentRunStep {
  id: number;
  agent_run_id: number;
  step_name: string;
  step_order: number;
  status: string;
  input_json: Record<string, unknown> | null;
  output_json: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
}

export interface AgentRunDetail {
  run: AgentRun;
  steps: AgentRunStep[];
}

export interface Contact {
  id: number;
  account_id: number;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  email: string | null;
  linkedin_url: string | null;
  source: string;
  verification_status: string;
  persona_type: string | null;
  priority: string | null;
  created_at: string;
}

export interface OutreachSequence {
  id: number;
  account_id: number;
  contact_id: number | null;
  email_subject: string | null;
  email_body: string | null;
  followup_body: string | null;
  quality_score: number | null;
  quality_feedback: string | null;
  created_at: string;
}
