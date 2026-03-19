/*
  # Create Budgets Schema

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, references artists)
      - `type` (text: release, show, tour, other)
      - `title` (text)
      - `status` (text: planning, in_progress, completed, cancelled)
      - `release_type` (text, optional: single, ep, album, compilation)
      - `release_date` (date, optional)
      - `album_id` (uuid, optional, references albums)
      - `show_id` (uuid, optional)
      - `venue` (text, optional)
      - `city` (text, optional)
      - `start_date` (date, optional)
      - `end_date` (date, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `budget_items`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `date` (date)
      - `description` (text)
      - `type` (text: Income, Expense)
      - `amount` (numeric)
      - `category` (text)
      - `status` (text: received, pending, paid, unpaid, Received, Pending, Paid, Unpaid)
      - `notes` (text, optional)
      - `attachments` (jsonb, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `budget_categories`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `category` (text)
      - `budget_amount` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('release', 'show', 'tour', 'other')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  release_type text CHECK (release_type IN ('single', 'ep', 'album', 'compilation')),
  release_date date,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  show_id uuid,
  venue text,
  city text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('Income', 'Expense')),
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  category text NOT NULL,
  status text NOT NULL CHECK (status IN ('received', 'pending', 'paid', 'unpaid', 'Received', 'Pending', 'Paid', 'Unpaid')),
  notes text,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  budget_amount numeric NOT NULL DEFAULT 0 CHECK (budget_amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(budget_id, category)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_artist_id ON budgets(artist_id);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_album_id ON budgets(album_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_type ON budget_items(type);
CREATE INDEX IF NOT EXISTS idx_budget_items_date ON budget_items(date);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Budgets policies - Allow all authenticated users
CREATE POLICY "Authenticated users can view budgets"
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

-- Budget items policies
CREATE POLICY "Authenticated users can view budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (true);

-- Budget categories policies
CREATE POLICY "Authenticated users can view budget categories"
  ON budget_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create budget categories"
  ON budget_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update budget categories"
  ON budget_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete budget categories"
  ON budget_categories FOR DELETE
  TO authenticated
  USING (true);