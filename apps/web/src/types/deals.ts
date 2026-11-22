// Types for the show deal system (show_deals and its child tables).
//
// The deal_* / show_types / deal_templates tables are not created by any
// migration in supabase/migrations (they are only referenced by cleanup and
// RLS migrations), and the original show_deals CREATE TABLE uses an older
// column set (deal_type, guarantee, percentage). These shapes are therefore
// derived from how ShowDealModal, DealSummaryCard and dealService read and
// write rows. Nullable numeric/text columns are typed `| null`.

export type DealStatus = 'draft' | 'negotiating' | 'agreed' | 'signed' | 'completed';

export type FeeStructure =
  | 'flat_guarantee'
  | 'guarantee_bonus'
  | 'versus'
  | 'door_split'
  | 'revenue_share'
  | 'buyout'
  | 'no_fee';

export type PercentageBase = 'gross' | 'net' | 'door';

export type ContractStatus = 'draft' | 'sent' | 'signed';

export interface NetDeduction {
  type: 'fixed' | 'percentage';
  amount?: number | null;
  rate?: number | null;
  label?: string;
}

export interface NegotiationLogEntry {
  date?: string;
  note?: string;
  author?: string;
  [key: string]: unknown;
}

export interface ShowDeal {
  id: string;
  show_id: string;
  template_id?: string | null;
  template_version?: number | null;
  status: DealStatus;
  currency: string;
  fee_structure: FeeStructure;
  guarantee_amount?: number | null;
  percentage_rate?: number | null;
  percentage_base?: PercentageBase | null;
  gross_inclusions: string[];
  net_deductions: Record<string, NetDeduction>;
  comps_policy: Record<string, unknown>;
  contract_status: ContractStatus;
  cancellation_terms?: string | null;
  insurance_required: boolean;
  insurance_amount?: number | null;
  production_provided: Record<string, unknown>;
  brand_approvals_required: boolean;
  confidentiality_required: boolean;
  negotiation_log: NegotiationLogEntry[];
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShowType {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface DealTemplate {
  id: string;
  show_type_id: string;
  name: string;
  description?: string | null;
  default_values: Partial<ShowDeal> | null;
  version: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DealTicketTier {
  id: string;
  deal_id: string;
  tier_name: string;
  price: number;
  capacity: number | null;
  fees_included: boolean;
  sort_order: number;
  created_at?: string;
}

export type DealPaymentType = 'deposit' | 'balance' | 'bonus' | 'reimbursement';

export type DealPaymentTiming =
  | 'on_booking'
  | 'pre_show'
  | 'show_day'
  | 'net_7'
  | 'net_15'
  | 'net_30';

export interface DealPayment {
  id: string;
  deal_id: string;
  payment_type: DealPaymentType;
  amount_type: 'fixed' | 'percentage';
  amount: number | null;
  due_timing: DealPaymentTiming | null;
  due_date?: string | null;
  paid: boolean;
  paid_date?: string | null;
  created_at?: string;
}

export type DealBonusType = 'sellout' | 'capacity_threshold' | 'gross_threshold' | 'merch_share';

export interface DealBonus {
  id: string;
  deal_id: string;
  bonus_type: DealBonusType;
  trigger_value: number | null;
  bonus_amount: number | null;
  description: string | null;
  created_at?: string;
}

export type DealExpenseCategory =
  | 'flights'
  | 'hotels'
  | 'ground_transport'
  | 'per_diem'
  | 'backline'
  | 'catering'
  | 'production';

export interface DealExpense {
  id: string;
  deal_id: string;
  category: DealExpenseCategory;
  responsibility: 'artist' | 'promoter' | 'shared';
  cap_amount: number | null;
  details: Record<string, unknown>;
  created_at?: string;
}

export interface DealMerchTerms {
  id: string;
  deal_id: string;
  merch_allowed: boolean;
  venue_cut_percentage: number | null;
  seller_provided_by: 'artist' | 'venue' | null;
  created_at?: string;
}

/** Aggregate returned by getDealByShowId in src/lib/dealService.ts. */
export interface DealSummary {
  deal: ShowDeal;
  ticket_tiers: DealTicketTier[];
  payments: DealPayment[];
  bonuses: DealBonus[];
  expenses: DealExpense[];
  merch_terms?: DealMerchTerms;
  expected_gross: number;
  expected_net: number;
  projected_payout: number;
  deposit_amount: number;
}
