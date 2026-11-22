import { supabase } from './supabase';
import type { ShowDeal, DealSummary, DealTicketTier, DealPayment, DealBonus, DealExpense, DealMerchTerms } from '../types/deals';

export async function getDealByShowId(showId: string): Promise<DealSummary | null> {
  const { data: deal, error: dealError } = await supabase
    .from('show_deals')
    .select('*')
    .eq('show_id', showId)
    .maybeSingle();

  if (dealError || !deal) return null;

  const [tiersRes, paymentsRes, bonusesRes, expensesRes, merchRes] = await Promise.all([
    supabase.from('deal_ticket_tiers').select('*').eq('deal_id', deal.id).order('sort_order'),
    supabase.from('deal_payments').select('*').eq('deal_id', deal.id),
    supabase.from('deal_bonuses').select('*').eq('deal_id', deal.id),
    supabase.from('deal_expenses').select('*').eq('deal_id', deal.id),
    supabase.from('deal_merch_terms').select('*').eq('deal_id', deal.id).maybeSingle(),
  ]);

  const ticket_tiers = tiersRes.data || [];
  const payments = paymentsRes.data || [];
  const bonuses = bonusesRes.data || [];
  const expenses = expensesRes.data || [];
  const merch_terms = merchRes.data || undefined;

  const expected_gross = ticket_tiers.reduce((sum, tier) => {
    return sum + (tier.price * (tier.capacity || 0));
  }, 0);

  const net_deductions = Object.values(deal.net_deductions || {}).reduce((sum: number, deduction: any) => {
    if (deduction.type === 'fixed') return sum + (deduction.amount || 0);
    if (deduction.type === 'percentage') return sum + (expected_gross * (deduction.rate || 0) / 100);
    return sum;
  }, 0);
  const expected_net = expected_gross - net_deductions;

  let projected_payout = 0;
  switch (deal.fee_structure) {
    case 'flat_guarantee':
    case 'guarantee_bonus':
      projected_payout = deal.guarantee_amount || 0;
      break;
    case 'versus':
      const percentagePayout = expected_net * ((deal.percentage_rate || 0) / 100);
      projected_payout = Math.max(deal.guarantee_amount || 0, percentagePayout);
      break;
    case 'door_split':
    case 'revenue_share':
      projected_payout = expected_gross * ((deal.percentage_rate || 0) / 100);
      break;
    default:
      projected_payout = deal.guarantee_amount || 0;
  }

  const deposit_payment = payments.find(p => p.payment_type === 'deposit');
  const deposit_amount = deposit_payment?.amount || 0;

  return {
    deal: deal as ShowDeal,
    ticket_tiers,
    payments,
    bonuses,
    expenses,
    merch_terms,
    expected_gross,
    expected_net,
    projected_payout,
    deposit_amount,
  };
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatFeeStructure(feeStructure: string): string {
  const labels: Record<string, string> = {
    flat_guarantee: 'Flat Guarantee',
    guarantee_bonus: 'Guarantee + Bonus',
    versus: 'Versus (Guarantee vs % of Net)',
    door_split: 'Door Split',
    revenue_share: 'Revenue Share',
    buyout: 'Buyout',
    no_fee: 'No Fee / Promotional',
  };
  return labels[feeStructure] || feeStructure;
}

export function formatDealStatus(status: string): { label: string; color: string } {
  const statuses: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'gray' },
    negotiating: { label: 'Negotiating', color: 'yellow' },
    agreed: { label: 'Agreed', color: 'blue' },
    signed: { label: 'Signed', color: 'green' },
    completed: { label: 'Completed', color: 'green' },
  };
  return statuses[status] || { label: status, color: 'gray' };
}
