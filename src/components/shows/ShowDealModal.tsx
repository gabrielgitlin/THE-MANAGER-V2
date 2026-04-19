import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Calendar, TrendingUp, Package, Briefcase, Plus } from 'lucide-react';
import type { ShowDeal, DealTemplate, ShowType, DealTicketTier, DealPayment, DealBonus, DealExpense, DealMerchTerms } from '../../types/deals';
import { supabase } from '../../lib/supabase';

interface ShowDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string;
  dealId?: string;
  onSave: () => void;
}

export default function ShowDealModal({ isOpen, onClose, showId, dealId, onSave }: ShowDealModalProps) {
  const [currentTab, setCurrentTab] = useState<'core' | 'ticketing' | 'payments' | 'bonuses' | 'expenses' | 'merch' | 'legal'>('core');
  const [showTypes, setShowTypes] = useState<ShowType[]>([]);
  const [templates, setTemplates] = useState<DealTemplate[]>([]);
  const [selectedShowType, setSelectedShowType] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<ShowDeal>>({
    show_id: showId,
    status: 'draft',
    currency: 'USD',
    fee_structure: 'flat_guarantee',
    gross_inclusions: [],
    net_deductions: {},
    comps_policy: {},
    contract_status: 'draft',
    insurance_required: false,
    production_provided: {},
    brand_approvals_required: false,
    confidentiality_required: false,
    negotiation_log: [],
  });

  const [ticketTiers, setTicketTiers] = useState<Partial<DealTicketTier>[]>([]);
  const [payments, setPayments] = useState<Partial<DealPayment>[]>([]);
  const [bonuses, setBonuses] = useState<Partial<DealBonus>[]>([]);
  const [expenses, setExpenses] = useState<Partial<DealExpense>[]>([]);
  const [merchTerms, setMerchTerms] = useState<Partial<DealMerchTerms>>({
    merch_allowed: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchShowTypes();
      if (dealId) {
        loadDealData();
      }
    }
  }, [isOpen, dealId]);

  useEffect(() => {
    if (selectedShowType) {
      fetchTemplates(selectedShowType);
    }
  }, [selectedShowType]);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateDefaults();
    }
  }, [selectedTemplate]);

  const fetchShowTypes = async () => {
    const { data } = await supabase
      .from('show_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (data) setShowTypes(data);
  };

  const fetchTemplates = async (showTypeId: string) => {
    const { data } = await supabase
      .from('deal_templates')
      .select('*')
      .eq('show_type_id', showTypeId)
      .eq('is_active', true);

    if (data) setTemplates(data);
  };

  const loadTemplateDefaults = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template && template.default_values) {
      setFormData(prev => ({
        ...prev,
        ...template.default_values,
        template_id: template.id,
        template_version: template.version,
      }));
    }
  };

  const loadDealData = async () => {
    if (!dealId) return;

    const { data: deal } = await supabase
      .from('show_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (deal) {
      setFormData(deal);

      const [tiersRes, paymentsRes, bonusesRes, expensesRes, merchRes] = await Promise.all([
        supabase.from('deal_ticket_tiers').select('*').eq('deal_id', dealId),
        supabase.from('deal_payments').select('*').eq('deal_id', dealId),
        supabase.from('deal_bonuses').select('*').eq('deal_id', dealId),
        supabase.from('deal_expenses').select('*').eq('deal_id', dealId),
        supabase.from('deal_merch_terms').select('*').eq('deal_id', dealId).maybeSingle(),
      ]);

      if (tiersRes.data) setTicketTiers(tiersRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (bonusesRes.data) setBonuses(bonusesRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
      if (merchRes.data) setMerchTerms(merchRes.data);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let savedDealId = dealId;

      if (savedDealId) {
        const { error } = await supabase
          .from('show_deals')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', savedDealId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('show_deals')
          .insert(formData)
          .select()
          .single();

        if (error) throw error;
        savedDealId = data.id;
      }

      if (ticketTiers.length > 0) {
        await supabase.from('deal_ticket_tiers').delete().eq('deal_id', savedDealId);
        await supabase.from('deal_ticket_tiers').insert(
          ticketTiers.map(t => ({ ...t, deal_id: savedDealId }))
        );
      }

      if (payments.length > 0) {
        await supabase.from('deal_payments').delete().eq('deal_id', savedDealId);
        await supabase.from('deal_payments').insert(
          payments.map(p => ({ ...p, deal_id: savedDealId }))
        );
      }

      if (bonuses.length > 0) {
        await supabase.from('deal_bonuses').delete().eq('deal_id', savedDealId);
        await supabase.from('deal_bonuses').insert(
          bonuses.map(b => ({ ...b, deal_id: savedDealId }))
        );
      }

      if (expenses.length > 0) {
        await supabase.from('deal_expenses').delete().eq('deal_id', savedDealId);
        await supabase.from('deal_expenses').insert(
          expenses.map(e => ({ ...e, deal_id: savedDealId }))
        );
      }

      if (merchTerms.merch_allowed !== undefined) {
        await supabase.from('deal_merch_terms').delete().eq('deal_id', savedDealId);
        await supabase.from('deal_merch_terms').insert({ ...merchTerms, deal_id: savedDealId });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Failed to save deal');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateExpectedGross = (): number => {
    return ticketTiers.reduce((sum, tier) => {
      return sum + ((tier.price || 0) * (tier.capacity || 0));
    }, 0);
  };

  const calculateProjectedPayout = (): number => {
    const gross = calculateExpectedGross();

    switch (formData.fee_structure) {
      case 'flat_guarantee':
      case 'guarantee_bonus':
        return formData.guarantee_amount || 0;

      case 'versus':
        const netDeductions = Object.values(formData.net_deductions || {}).reduce((sum: number, deduction: any) => {
          if (deduction.type === 'fixed') return sum + (deduction.amount || 0);
          if (deduction.type === 'percentage') return sum + (gross * (deduction.rate || 0) / 100);
          return sum;
        }, 0);
        const net = gross - netDeductions;
        const percentagePayout = net * ((formData.percentage_rate || 0) / 100);
        return Math.max(formData.guarantee_amount || 0, percentagePayout);

      case 'door_split':
      case 'revenue_share':
        return gross * ((formData.percentage_rate || 0) / 100);

      default:
        return formData.guarantee_amount || 0;
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'core', label: 'Core Terms', icon: DollarSign },
    { id: 'ticketing', label: 'Ticketing', icon: FileText },
    { id: 'payments', label: 'Payments', icon: Calendar },
    { id: 'bonuses', label: 'Bonuses', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: Package },
    { id: 'merch', label: 'Merch', icon: Briefcase },
    { id: 'legal', label: 'Legal', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div style={{ background: 'var(--surface)' }} className="relative rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div style={{ borderColor: 'var(--border)' }} className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--t1)' }}>
              {dealId ? 'Edit Deal Terms' : 'Add Deal Terms'}
            </h2>
            <button onClick={onClose} className="hover:opacity-80" style={{ color: 'var(--t3)' }}>
              <img src="/TM-Close-negro.svg" className="pxi-xl icon-white" alt="" />
            </button>
          </div>

          {!dealId && (
            <div style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }} className="px-6 py-4 border-b">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--t1)' }}>
                    Show Type
                  </label>
                  <select
                    value={selectedShowType}
                    onChange={(e) => setSelectedShowType(e.target.value)}
                    className="w-full shadow-sm focus:border-primary focus:ring-primary" style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                  >
                    <option value="">Select show type...</option>
                    {showTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    disabled={!selectedShowType}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">Select template...</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="sub-tabs px-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCurrentTab(id as typeof currentTab)}
                className={`sub-tab ${currentTab === id ? 'active' : ''}`}
              >
                <Icon className="tab-icon" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {currentTab === 'core' && (
              <CoreTermsTab formData={formData} setFormData={setFormData} />
            )}
            {currentTab === 'ticketing' && (
              <TicketingTab
                ticketTiers={ticketTiers}
                setTicketTiers={setTicketTiers}
                expectedGross={calculateExpectedGross()}
              />
            )}
            {currentTab === 'payments' && (
              <PaymentsTab payments={payments} setPayments={setPayments} />
            )}
            {currentTab === 'bonuses' && (
              <BonusesTab bonuses={bonuses} setBonuses={setBonuses} />
            )}
            {currentTab === 'expenses' && (
              <ExpensesTab expenses={expenses} setExpenses={setExpenses} />
            )}
            {currentTab === 'merch' && (
              <MerchTab merchTerms={merchTerms} setMerchTerms={setMerchTerms} />
            )}
            {currentTab === 'legal' && (
              <LegalTab formData={formData} setFormData={setFormData} />
            )}
          </div>

          <div style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }} className="px-6 py-4 border-t">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs uppercase" style={{ color: 'var(--t2)' }}>Expected Gross</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>${calculateExpectedGross().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase" style={{ color: 'var(--t2)' }}>Projected Payout</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--t1)' }}>${calculateProjectedPayout().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase" style={{ color: 'var(--t2)' }}>Deal Status</p>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="text-sm rounded" style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
                >
                  <option value="draft">Draft</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="agreed">Agreed</option>
                  <option value="signed">Signed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium hover:opacity-80" style={{ color: 'var(--t1)', background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Deal'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoreTermsTab({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure</label>
          <select
            value={formData.fee_structure}
            onChange={(e) => setFormData({ ...formData, fee_structure: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="flat_guarantee">Flat Guarantee</option>
            <option value="guarantee_bonus">Guarantee + Bonus</option>
            <option value="versus">Versus</option>
            <option value="door_split">Door Split</option>
            <option value="revenue_share">Revenue Share</option>
            <option value="buyout">Buyout</option>
            <option value="no_fee">No Fee</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guarantee Amount</label>
          <input
            type="number"
            value={formData.guarantee_amount || ''}
            onChange={(e) => setFormData({ ...formData, guarantee_amount: parseFloat(e.target.value) })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            placeholder="0.00"
          />
        </div>

        {(['versus', 'door_split', 'revenue_share'].includes(formData.fee_structure)) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Percentage Rate</label>
            <div className="relative">
              <input
                type="number"
                value={formData.percentage_rate || ''}
                onChange={(e) => setFormData({ ...formData, percentage_rate: parseFloat(e.target.value) })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary pr-8"
                placeholder="0"
                step="0.1"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>
        )}
      </div>

      {formData.fee_structure === 'versus' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Percentage Base</label>
          <select
            value={formData.percentage_base}
            onChange={(e) => setFormData({ ...formData, percentage_base: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="gross">Gross Receipts</option>
            <option value="net">Net Receipts</option>
            <option value="door">Door Sales</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          placeholder="Deal notes and details..."
        />
      </div>
    </div>
  );
}

function TicketingTab({ ticketTiers, setTicketTiers, expectedGross }: any) {
  const addTier = () => {
    setTicketTiers([...ticketTiers, {
      tier_name: '',
      price: 0,
      capacity: 0,
      fees_included: false,
      sort_order: ticketTiers.length,
    }]);
  };

  const removeTier = (index: number) => {
    setTicketTiers(ticketTiers.filter((_: any, i: number) => i !== index));
  };

  const updateTier = (index: number, field: string, value: any) => {
    const updated = [...ticketTiers];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTiers(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Ticket Tiers</h3>
        <button
          onClick={addTier}
          className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          <Plus className="w-4 h-4" />
          Add Tier
        </button>
      </div>

      <div className="space-y-4">
        {ticketTiers.map((tier: any, index: number) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tier Name</label>
                <input
                  type="text"
                  value={tier.tier_name || ''}
                  onChange={(e) => updateTier(index, 'tier_name', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm"
                  placeholder="GA, VIP, etc."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  value={tier.price || ''}
                  onChange={(e) => updateTier(index, 'price', parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  value={tier.capacity || ''}
                  onChange={(e) => updateTier(index, 'capacity', parseInt(e.target.value))}
                  className="w-full rounded-md border-gray-300 text-sm"
                  placeholder="0"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => removeTier(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-primary/5 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Expected Gross Potential</span>
          <span className="text-lg font-semibold text-primary">${expectedGross.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function PaymentsTab({ payments, setPayments }: any) {
  const addPayment = () => {
    setPayments([...payments, {
      payment_type: 'balance',
      amount_type: 'fixed',
      paid: false,
    }]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_: any, i: number) => i !== index));
  };

  const updatePayment = (index: number, field: string, value: any) => {
    const updated = [...payments];
    updated[index] = { ...updated[index], [field]: value };
    setPayments(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Payment Schedule</h3>
        <button
          onClick={addPayment}
          className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          <Plus className="w-4 h-4" />
          Add Payment
        </button>
      </div>

      <div className="space-y-4">
        {payments.map((payment: any, index: number) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Type</label>
                <select
                  value={payment.payment_type}
                  onChange={(e) => updatePayment(index, 'payment_type', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm"
                >
                  <option value="deposit">Deposit</option>
                  <option value="balance">Balance</option>
                  <option value="bonus">Bonus</option>
                  <option value="reimbursement">Reimbursement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={payment.amount || ''}
                  onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Timing</label>
                <select
                  value={payment.due_timing}
                  onChange={(e) => updatePayment(index, 'due_timing', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm"
                >
                  <option value="on_booking">On Booking</option>
                  <option value="pre_show">Pre-Show</option>
                  <option value="show_day">Show Day</option>
                  <option value="net_7">Net 7</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => removePayment(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BonusesTab({ bonuses, setBonuses }: any) {
  const addBonus = () => {
    setBonuses([...bonuses, { bonus_type: 'sellout' }]);
  };

  const removeBonus = (index: number) => {
    setBonuses(bonuses.filter((_: any, i: number) => i !== index));
  };

  const updateBonus = (index: number, field: string, value: any) => {
    const updated = [...bonuses];
    updated[index] = { ...updated[index], [field]: value };
    setBonuses(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Bonuses</h3>
        <button
          onClick={addBonus}
          className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          <Plus className="w-4 h-4" />
          Add Bonus
        </button>
      </div>

      <div className="space-y-4">
        {bonuses.map((bonus: any, index: number) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bonus Type</label>
                <select
                  value={bonus.bonus_type}
                  onChange={(e) => updateBonus(index, 'bonus_type', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm"
                >
                  <option value="sellout">Sellout</option>
                  <option value="capacity_threshold">Capacity Threshold</option>
                  <option value="gross_threshold">Gross Threshold</option>
                  <option value="merch_share">Merch Share</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
                <input
                  type="number"
                  value={bonus.trigger_value || ''}
                  onChange={(e) => updateBonus(index, 'trigger_value', parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 text-sm"
                  placeholder="90"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={bonus.bonus_amount || ''}
                  onChange={(e) => updateBonus(index, 'bonus_amount', parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => removeBonus(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpensesTab({ expenses, setExpenses }: any) {
  const addExpense = () => {
    setExpenses([...expenses, {
      category: 'hotels',
      responsibility: 'promoter',
      details: {},
    }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_: any, i: number) => i !== index));
  };

  const updateExpense = (index: number, field: string, value: any) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Expenses</h3>
        <button
          onClick={addExpense}
          className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary hover:text-primary/80"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="space-y-4">
        {expenses.map((expense: any, index: number) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={expense.category}
                  onChange={(e) => updateExpense(index, 'category', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm"
                >
                  <option value="flights">Flights</option>
                  <option value="hotels">Hotels</option>
                  <option value="ground_transport">Ground Transport</option>
                  <option value="per_diem">Per Diem</option>
                  <option value="backline">Backline</option>
                  <option value="catering">Catering</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Responsibility</label>
                <select
                  value={expense.responsibility}
                  onChange={(e) => updateExpense(index, 'responsibility', e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm"
                >
                  <option value="artist">Artist</option>
                  <option value="promoter">Promoter</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cap</label>
                <input
                  type="number"
                  value={expense.cap_amount || ''}
                  onChange={(e) => updateExpense(index, 'cap_amount', parseFloat(e.target.value))}
                  className="w-full rounded-md border-gray-300 text-sm"
                  placeholder="No cap"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => removeExpense(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MerchTab({ merchTerms, setMerchTerms }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={merchTerms.merch_allowed}
            onChange={(e) => setMerchTerms({ ...merchTerms, merch_allowed: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">Merch Sales Allowed</span>
        </label>
      </div>

      {merchTerms.merch_allowed && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Cut %</label>
              <input
                type="number"
                value={merchTerms.venue_cut_percentage || ''}
                onChange={(e) => setMerchTerms({ ...merchTerms, venue_cut_percentage: parseFloat(e.target.value) })}
                className="w-full rounded-md border-gray-300"
                placeholder="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seller Provided By</label>
              <select
                value={merchTerms.seller_provided_by}
                onChange={(e) => setMerchTerms({ ...merchTerms, seller_provided_by: e.target.value })}
                className="w-full rounded-md border-gray-300"
              >
                <option value="artist">Artist</option>
                <option value="venue">Venue</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LegalTab({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contract Status</label>
        <select
          value={formData.contract_status}
          onChange={(e) => setFormData({ ...formData, contract_status: e.target.value })}
          className="w-full rounded-md border-gray-300"
        >
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="signed">Signed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Terms</label>
        <textarea
          value={formData.cancellation_terms || ''}
          onChange={(e) => setFormData({ ...formData, cancellation_terms: e.target.value })}
          rows={3}
          className="w-full rounded-md border-gray-300"
          placeholder="Cancellation policy..."
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.insurance_required}
            onChange={(e) => setFormData({ ...formData, insurance_required: e.target.checked })}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium text-gray-700">Insurance Required</span>
        </label>
      </div>

      {formData.insurance_required && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Amount</label>
          <input
            type="number"
            value={formData.insurance_amount || ''}
            onChange={(e) => setFormData({ ...formData, insurance_amount: parseFloat(e.target.value) })}
            className="w-full rounded-md border-gray-300"
            placeholder="0.00"
          />
        </div>
      )}
    </div>
  );
}
