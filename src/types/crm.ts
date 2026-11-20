export type LeadStatus = 'Lead' | 'Prospect' | 'Customer';

export type OpportunityStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

export type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Note';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  lead_id: string;
  title: string;
  value_rm: number;
  stage: OpportunityStage;
  created_at: string;
  updated_at: string;
  // Join fields for UI presentation
  lead?: {
    name: string;
    company: string;
  };
}

export interface Activity {
  id: string;
  lead_id?: string | null;
  opportunity_id?: string | null;
  type: ActivityType;
  date: string;
  description: string;
  created_at: string;
  // Join fields
  lead_name?: string;
  company_name?: string;
}

export interface DashboardStats {
  totalContacts: number;
  openOpportunitiesCount: number;
  totalPipelineValueRM: number;
  dealsWonRM: number;
  recentActivities: Activity[];
}
