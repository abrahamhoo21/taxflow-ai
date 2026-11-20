import { supabaseAdmin } from '@/lib/supabase';
import { Lead, Opportunity, LeadStatus, OpportunityStage } from '@/types/crm';
import { LEAD_STATUSES, OPPORTUNITY_STAGES } from '@/constants/crm';

/**
 * CRM Domain Service - Clean Architecture Application Layer
 * Contains pure business logic for Lead and Opportunity lifecycles.
 */
export class CRMService {
  /**
   * List leads with optional search and status filtering
   */
  static async getLeads(search?: string, status?: string): Promise<Lead[]> {
    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch leads: ${error.message}`);
    return data || [];
  }

  /**
   * Create a new lead with validation
   */
  static async createLead(payload: {
    name: string;
    email: string;
    phone: string;
    company: string;
    status?: LeadStatus;
  }): Promise<Lead> {
    const { name, email, phone, company, status = LEAD_STATUSES.LEAD } = payload;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        name,
        email,
        phone,
        company,
        status,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create lead: ${error.message}`);
    return data;
  }

  /**
   * Delete lead by ID (Cascades to related opportunities and activities)
   */
  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete lead: ${error.message}`);
  }

  /**
   * List all opportunities joined with contact details for Kanban display
   */
  static async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .select('*, lead:leads(name, company)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch opportunities: ${error.message}`);
    return data || [];
  }

  /**
   * Create a new opportunity
   */
  static async createOpportunity(payload: {
    lead_id: string;
    title: string;
    value_rm: number;
    stage?: OpportunityStage;
  }): Promise<Opportunity> {
    const { lead_id, title, value_rm, stage = OPPORTUNITY_STAGES.NEW } = payload;

    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .insert({
        lead_id,
        title,
        value_rm,
        stage,
      })
      .select('*, lead:leads(name, company)')
      .single();

    if (error) throw new Error(`Failed to create opportunity: ${error.message}`);
    return data;
  }

  /**
   * Transition opportunity to another stage (e.g. via Kanban drag & drop)
   */
  static async updateOpportunityStage(id: string, stage: OpportunityStage, value_rm?: number): Promise<Opportunity> {
    const updates: Record<string, unknown> = {
      stage,
      updated_at: new Date().toISOString(),
    };
    if (value_rm !== undefined) updates.value_rm = value_rm;

    const { data, error } = await supabaseAdmin
      .from('opportunities')
      .update(updates)
      .eq('id', id)
      .select('*, lead:leads(name, company)')
      .single();

    if (error) throw new Error(`Failed to update opportunity: ${error.message}`);
    return data;
  }
}
