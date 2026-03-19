import { supabase } from './supabase';
import type { Budget, BudgetItem, BudgetCategory } from '../types';

export interface CommissionBreakdown {
  grossIncome: number;
  totalExpenses: number;
  grossProfit: number;
  bookingAgentCommission: number;
  netAfterBookingAgent: number;
  managementCommission: number;
  netProfit: number;
  bookingAgentRate: number;
  managementRate: number;
}

export interface DatabaseBudget {
  id: string;
  artist_id: string;
  type: string;
  title: string;
  status: string;
  release_type?: string;
  release_date?: string;
  album_id?: string;
  show_id?: string;
  venue?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  booking_agent_commission_rate?: number;
  management_commission_rate?: number;
  apply_commissions?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBudgetItem {
  id: string;
  budget_id: string;
  date: string;
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  status: string;
  notes?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface DatabaseBudgetCategory {
  id: string;
  budget_id: string;
  category: string;
  budget_amount: number;
  created_at: string;
  updated_at: string;
}

function convertDatabaseToBudget(
  dbBudget: DatabaseBudget,
  items: DatabaseBudgetItem[],
  categories: DatabaseBudgetCategory[],
  artistName: string
): Budget {
  return {
    id: dbBudget.id as any,
    type: dbBudget.type as any,
    title: dbBudget.title,
    artist: artistName,
    status: dbBudget.status as any,
    releaseType: dbBudget.release_type as any,
    releaseDate: dbBudget.release_date,
    albumId: dbBudget.album_id as any,
    showId: dbBudget.show_id,
    venue: dbBudget.venue,
    city: dbBudget.city,
    startDate: dbBudget.start_date,
    endDate: dbBudget.end_date,
    budgetItems: items.map(item => ({
      id: item.id as any,
      date: item.date,
      description: item.description,
      type: item.type,
      amount: Number(item.amount),
      category: item.category as any,
      status: item.status as any,
      notes: item.notes,
      attachments: item.attachments,
    })),
    categoryBudgets: categories.map(cat => ({
      category: cat.category as any,
      budgetAmount: Number(cat.budget_amount),
    })),
    bookingAgentCommissionRate: dbBudget.booking_agent_commission_rate ? Number(dbBudget.booking_agent_commission_rate) : 10,
    managementCommissionRate: dbBudget.management_commission_rate ? Number(dbBudget.management_commission_rate) : 20,
    applyCommissions: dbBudget.apply_commissions || false,
  };
}

export async function getAllBudgets(): Promise<Budget[]> {
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false });

  if (budgetsError) throw budgetsError;
  if (!budgets) return [];

  const { data: items } = await supabase
    .from('budget_items')
    .select('*')
    .in('budget_id', budgets.map(b => b.id));

  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .in('budget_id', budgets.map(b => b.id));

  const { data: artists } = await supabase
    .from('artists')
    .select('id, name')
    .in('id', budgets.map(b => b.artist_id));

  const artistMap = new Map(artists?.map(a => [a.id, a.name]) || []);

  return budgets.map(budget => {
    const budgetItems = items?.filter(i => i.budget_id === budget.id) || [];
    const budgetCategories = categories?.filter(c => c.budget_id === budget.id) || [];
    const artistName = artistMap.get(budget.artist_id) || 'Unknown Artist';

    return convertDatabaseToBudget(budget, budgetItems, budgetCategories, artistName);
  });
}

export async function getBudgetById(id: string): Promise<Budget | null> {
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (budgetError) throw budgetError;
  if (!budget) return null;

  const { data: items } = await supabase
    .from('budget_items')
    .select('*')
    .eq('budget_id', id)
    .order('date', { ascending: false });

  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('budget_id', id);

  const { data: artist } = await supabase
    .from('artists')
    .select('name')
    .eq('id', budget.artist_id)
    .maybeSingle();

  return convertDatabaseToBudget(
    budget,
    items || [],
    categories || [],
    artist?.name || 'Unknown Artist'
  );
}

export async function createBudget(budget: Partial<Budget>, artistId: string): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      artist_id: artistId,
      type: budget.type,
      title: budget.title,
      status: budget.status || 'planning',
      release_type: budget.releaseType,
      release_date: budget.releaseDate,
      album_id: budget.albumId,
      show_id: budget.showId,
      venue: budget.venue,
      city: budget.city,
      start_date: budget.startDate,
      end_date: budget.endDate,
    })
    .select()
    .single();

  if (error) throw error;

  if (budget.categoryBudgets) {
    await Promise.all(
      budget.categoryBudgets.map(cat =>
        supabase.from('budget_categories').insert({
          budget_id: data.id,
          category: cat.category,
          budget_amount: cat.budgetAmount,
        })
      )
    );
  }

  return getBudgetById(data.id) as Promise<Budget>;
}

export async function updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .update({
      title: updates.title,
      status: updates.status,
      release_type: updates.releaseType,
      release_date: updates.releaseDate,
      venue: updates.venue,
      city: updates.city,
      start_date: updates.startDate,
      end_date: updates.endDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createBudgetItem(budgetId: string, item: Omit<BudgetItem, 'id'>): Promise<BudgetItem> {
  const { data, error } = await supabase
    .from('budget_items')
    .insert({
      budget_id: budgetId,
      date: item.date,
      description: item.description,
      type: item.type,
      amount: item.amount,
      category: item.category,
      status: item.status,
      notes: item.notes,
      attachments: item.attachments || [],
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id as any,
    date: data.date,
    description: data.description,
    type: data.type,
    amount: Number(data.amount),
    category: data.category,
    status: data.status,
    notes: data.notes,
    attachments: data.attachments,
  };
}

export async function updateBudgetItem(id: string, updates: Partial<BudgetItem>): Promise<void> {
  const { error } = await supabase
    .from('budget_items')
    .update({
      date: updates.date,
      description: updates.description,
      type: updates.type,
      amount: updates.amount,
      category: updates.category,
      status: updates.status,
      notes: updates.notes,
      attachments: updates.attachments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteBudgetItem(id: string): Promise<void> {
  const { error} = await supabase
    .from('budget_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateBudgetCategory(
  budgetId: string,
  category: string,
  amount: number
): Promise<void> {
  const { error } = await supabase
    .from('budget_categories')
    .upsert({
      budget_id: budgetId,
      category,
      budget_amount: amount,
    }, {
      onConflict: 'budget_id,category'
    });

  if (error) throw error;
}

export async function getAllBudgetItems(): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map(item => ({
    id: item.id as any,
    date: item.date,
    description: item.description,
    type: item.type,
    amount: Number(item.amount),
    category: item.category,
    status: item.status,
    notes: item.notes,
    attachments: item.attachments,
  }));
}

export function calculateCommissions(budget: Budget): CommissionBreakdown {
  const grossIncome = (budget.budgetItems || [])
    .filter(item => item.type === 'Income')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = (budget.budgetItems || [])
    .filter(item => item.type === 'Expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const grossProfit = grossIncome - totalExpenses;

  if (!budget.applyCommissions) {
    return {
      grossIncome,
      totalExpenses,
      grossProfit,
      bookingAgentCommission: 0,
      netAfterBookingAgent: grossProfit,
      managementCommission: 0,
      netProfit: grossProfit,
      bookingAgentRate: budget.bookingAgentCommissionRate || 10,
      managementRate: budget.managementCommissionRate || 20,
    };
  }

  const bookingAgentRate = budget.bookingAgentCommissionRate || 10;
  const managementRate = budget.managementCommissionRate || 20;

  // Booking agent commission is calculated on gross income
  const bookingAgentCommission = grossIncome * (bookingAgentRate / 100);

  // Net after booking agent commission
  const netAfterBookingAgent = grossProfit - bookingAgentCommission;

  // Management commission is calculated on net after booking agent
  const managementCommission = netAfterBookingAgent * (managementRate / 100);

  // Final net profit after all commissions
  const netProfit = netAfterBookingAgent - managementCommission;

  return {
    grossIncome,
    totalExpenses,
    grossProfit,
    bookingAgentCommission,
    netAfterBookingAgent,
    managementCommission,
    netProfit,
    bookingAgentRate,
    managementRate,
  };
}

export async function updateBudgetCommissions(
  id: string,
  bookingAgentRate: number,
  managementRate: number,
  applyCommissions: boolean
): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .update({
      booking_agent_commission_rate: bookingAgentRate,
      management_commission_rate: managementRate,
      apply_commissions: applyCommissions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
