/*
  # Add Budgets Table with Entity Linking

  ## Overview
  This migration creates a budgets table that can be linked to albums, shows, or other entities,
  enabling cross-page budget management and tracking.

  ## New Tables

  ### Budgets
  - `id` (uuid, primary key)
  - `title` (text) - Budget title
  - `type` (text) - Budget type: release, show, tour, other
  - `status` (text) - Budget status: planning, in_progress, completed
  - `artist_id` (uuid, foreign key to artists) - Artist this budget belongs to
  - `album_id` (uuid, nullable, foreign key to albums) - Linked album for release budgets
  - `show_id` (uuid, nullable, foreign key to shows) - Linked show for show budgets
  - `total_budget` (decimal) - Total allocated budget
  - `total_spent` (decimal) - Total amount spent
  - `start_date` (date) - Budget start date
  - `end_date` (date, nullable) - Budget end date
  - `notes` (text) - Additional notes
  - `created_at`, `updated_at` (timestamptz)

  ### Budget Items
  - `id` (uuid, primary key)
  - `budget_id` (uuid, foreign key to budgets)
  - `date` (date) - Transaction date
  - `description` (text) - Item description
  - `type` (text) - Income or Expense
  - `category` (text) - Budget category (Art, Digital, Marketing, Music, Press, Other)
  - `amount` (decimal) - Transaction amount
  - `status` (text) - Payment status (paid, unpaid, received, pending)
  - `notes` (text, nullable) - Additional notes
  - `attachments` (jsonb, nullable) - File attachments as JSON array
  - `created_at`, `updated_at` (timestamptz)

  ### Budget Category Allocations
  - `id` (uuid, primary key)
  - `budget_id` (uuid, foreign key to budgets)
  - `category` (text) - Category name
  - `allocated_amount` (decimal) - Amount allocated to this category
  - `created_at`, `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies allow authenticated users full access
  - Future enhancement: restrict by user ownership

  ## Notes
  - Budgets can be linked to albums, shows, or standalone
  - Budget items track individual income/expense transactions
  - Category allocations enable budget tracking by category
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'planning',
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  show_id uuid REFERENCES shows(id) ON DELETE SET NULL,
  total_budget decimal(10,2) DEFAULT 0,
  total_spent decimal(10,2) DEFAULT 0,
  start_date date,
  end_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_category_allocations table
CREATE TABLE IF NOT EXISTS budget_category_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  allocated_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(budget_id, category)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_budgets_artist_id ON budgets(artist_id);
CREATE INDEX IF NOT EXISTS idx_budgets_album_id ON budgets(album_id);
CREATE INDEX IF NOT EXISTS idx_budgets_show_id ON budgets(show_id);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_date ON budget_items(date);
CREATE INDEX IF NOT EXISTS idx_budget_category_allocations_budget_id ON budget_category_allocations(budget_id);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_category_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budgets
CREATE POLICY "Authenticated users can view all budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for budget_items
CREATE POLICY "Authenticated users can view all budget_items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget_items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget_items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget_items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for budget_category_allocations
CREATE POLICY "Authenticated users can view all budget_category_allocations"
  ON budget_category_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget_category_allocations"
  ON budget_category_allocations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget_category_allocations"
  ON budget_category_allocations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget_category_allocations"
  ON budget_category_allocations FOR DELETE
  TO authenticated
  USING (true);
